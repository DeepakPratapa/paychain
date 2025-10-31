from web3 import Web3
from eth_account import Account
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class BlockchainClient:
    def __init__(self, ganache_url: str, contract_address: str, private_key: str):
        self.w3 = Web3(Web3.HTTPProvider(ganache_url))
        self.contract_address = Web3.to_checksum_address(contract_address) if contract_address else None
        self.account = Account.from_key(private_key)
        self.contract = None
        
        # Load contract ABI
        try:
            with open('contract_abi.json', 'r') as f:
                self.contract_abi = json.load(f)
            
            if self.contract_address:
                self.contract = self.w3.eth.contract(
                    address=self.contract_address,
                    abi=self.contract_abi
                )
                logger.info(f"✅ Connected to contract at {self.contract_address}")
        except FileNotFoundError:
            logger.warning("⚠️  Contract ABI not found. Run deployment first.")
            self.contract_abi = []
    
    def is_connected(self) -> bool:
        """Check if connected to blockchain"""
        try:
            return self.w3.is_connected()
        except Exception as e:
            logger.error(f"Connection check failed: {e}")
            return False
    
    def get_balance(self, address: str) -> float:
        """Get wallet balance in ETH"""
        try:
            checksum_address = Web3.to_checksum_address(address)
            balance_wei = self.w3.eth.get_balance(checksum_address)
            balance_eth = self.w3.from_wei(balance_wei, 'ether')
            return float(balance_eth)
        except Exception as e:
            logger.error(f"Get balance failed: {e}")
            return 0.0
    
    def create_job(self, job_id: int, time_limit_hours: int, amount_eth: float, employer_address: str) -> Optional[dict]:
        """Create job and lock funds in escrow"""
        try:
            if not self.contract:
                raise Exception("Contract not initialized")
            
            # Convert ETH to Wei
            amount_wei = self.w3.to_wei(amount_eth, 'ether')
            
            checksum_employer = Web3.to_checksum_address(employer_address)
            
            # For demo: derive private key from Ganache mnemonic based on address
            # Ganache uses deterministic wallets with known mnemonic
            employer_key = self._get_private_key_for_address(checksum_employer)
            
            if not employer_key:
                raise Exception(f"Cannot derive private key for employer {checksum_employer}")
            
            # Build transaction
            txn = self.contract.functions.createJob(
                job_id,
                time_limit_hours
            ).build_transaction({
                'from': checksum_employer,
                'value': amount_wei,
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(checksum_employer)
            })
            
            # Sign transaction with employer's key
            signed_txn = self.w3.eth.account.sign_transaction(txn, employer_key)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            return {
                'transaction_hash': receipt['transactionHash'].hex(),
                'block_number': receipt['blockNumber'],
                'gas_used': receipt['gasUsed'],
                'status': 'confirmed' if receipt['status'] == 1 else 'failed',
                'contract_address': self.contract_address
            }
            
        except Exception as e:
            logger.error(f"Create job failed: {e}")
            return None
    
    def release_payment(self, job_id: int, worker_address: str) -> Optional[dict]:
        """Release payment to worker"""
        try:
            if not self.contract:
                raise Exception("Contract not initialized")
            
            checksum_worker = Web3.to_checksum_address(worker_address)
            
            logger.info(f"Attempting to release payment for job {job_id} to worker {checksum_worker}")
            
            # First, check job status
            try:
                job_data = self.contract.functions.getJob(job_id).call()
                logger.info(f"Job {job_id} status: employer={job_data[1]}, worker={job_data[2]}, amount={job_data[3]}, isLocked={job_data[7]}, isCompleted={job_data[8]}")
            except Exception as e:
                logger.error(f"Failed to get job data: {e}")
            
            # Build transaction
            txn = self.contract.functions.releasePayment(
                job_id,
                checksum_worker
            ).build_transaction({
                'from': self.account.address,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address)
            })
            
            # Sign and send
            signed_txn = self.w3.eth.account.sign_transaction(txn, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Get job details to calculate amounts
            job_data = self.contract.functions.getJob(job_id).call()
            
            return {
                'transaction_hash': receipt['transactionHash'].hex(),
                'block_number': receipt['blockNumber'],
                'gas_used': receipt['gasUsed'],
                'status': 'confirmed' if receipt['status'] == 1 else 'failed',
                'amount_sent': self.w3.from_wei(job_data[3], 'ether'),  # workerAmount
                'platform_fee': self.w3.from_wei(job_data[4], 'ether')   # platformFee
            }
            
        except Exception as e:
            import traceback
            logger.error(f"Release payment failed: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return None
    
    def refund_expired_job(self, job_id: int) -> Optional[dict]:
        """Refund employer for expired job"""
        try:
            if not self.contract:
                raise Exception("Contract not initialized")
            
            # Build transaction
            txn = self.contract.functions.refundExpiredJob(
                job_id
            ).build_transaction({
                'from': self.account.address,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address)
            })
            
            # Sign and send
            signed_txn = self.w3.eth.account.sign_transaction(txn, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            return {
                'transaction_hash': receipt['transactionHash'].hex(),
                'block_number': receipt['blockNumber'],
                'gas_used': receipt['gasUsed'],
                'status': 'confirmed' if receipt['status'] == 1 else 'failed'
            }
            
        except Exception as e:
            logger.error(f"Refund failed: {e}")
            return None
    
    def get_job_balance(self, job_id: int) -> float:
        """Get locked balance for job"""
        try:
            if not self.contract:
                return 0.0
            
            balance_wei = self.contract.functions.getJobBalance(job_id).call()
            return float(self.w3.from_wei(balance_wei, 'ether'))
            
        except Exception as e:
            logger.error(f"Get job balance failed: {e}")
            return 0.0
    
    def get_contract_stats(self) -> dict:
        """Get contract statistics"""
        try:
            if not self.contract:
                return {}
            
            stats = self.contract.functions.getContractStats().call()
            
            return {
                'total_escrow_locked': float(self.w3.from_wei(stats[0], 'ether')),
                'total_fees_collected': float(self.w3.from_wei(stats[1], 'ether')),
                'contract_balance': float(self.w3.from_wei(stats[2], 'ether'))
            }
            
        except Exception as e:
            logger.error(f"Get contract stats failed: {e}")
            return {}
    
    def _get_private_key_for_address(self, address: str) -> Optional[str]:
        """
        Get private key for Ganache address using known mnemonic.
        For demo purposes only - uses Ganache's default mnemonic.
        """
        # Ganache default mnemonic
        GANACHE_MNEMONIC = "test test test test test test test test test test test junk"
        
        # Known Ganache accounts (first 10)
        GANACHE_ACCOUNTS = {
            "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
            "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
            "0x90F79bf6EB2c4f870365E785982E1f101E93b906": "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
            "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65": "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
            "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc": "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
            "0x976EA74026E726554dB657fA54763abd0C3a0aa9": "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
            "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955": "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
            "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f": "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
            "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720": "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6",
        }
        
        checksum_address = Web3.to_checksum_address(address)
        return GANACHE_ACCOUNTS.get(checksum_address)
