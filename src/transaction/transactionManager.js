import state from '../common/state/index.js';
import {v4 as uuidv4} from 'uuid';

class TransactionManager {
  constructor(db, eventEmitter) {
    this.eventEmitter = eventEmitter;
    this.db = db;
    this.pendingTransactions = new Map();
  }

  // Create a new transaction
  async createTransaction(senderId, receiverId, amount) {
    const transaction = {
      id: uuidv4(),
      senderId,
      receiverId,
      amount,
      timestamp: Date.now(),
      status: 'pending',
    };

    this.pendingTransactions.set(transaction.id, transaction);

    // Notify peers about the new transaction
    this.eventEmitter.emit('notifyPeers', transaction);

    return transaction;
  }

  // Validate a transaction
  async validateTransaction(transaction) {
    // Check for sufficient balance
    const senderBalance = await this.getBalance(transaction.senderId);
    if (senderBalance < transaction.amount) {
      return false;
    }

    // Notify peers about the new transaction
    this.eventEmitter.emit('notifyPeers', 'Transaction Validated', transaction);
    return true;
  }

  // Receive a transaction from the network
  async receiveTransaction(transaction) {
    if (await this.validateTransaction(transaction)) {
      this.pendingTransactions.set(transaction.id, transaction);
      // Optionally, broadcast the transaction to other peers
      this.eventEmitter.emit(
        'notifyPeers',
        'Transaction Received',
        transaction,
      );
      return {status: 'accepted'};
    } else {
      return {status: 'rejected', reason: 'Invalid transaction'};
    }
  }

  // Confirm a transaction
  async confirmTransaction(transactionId) {
    const transaction = this.pendingTransactions.get(transactionId);
    if (transaction) {
      transaction.status = 'confirmed';
      await this.updateLedger(transaction);
      this.pendingTransactions.delete(transactionId);
      return {status: 'confirmed'};
    } else {
      return {status: 'error', reason: 'Transaction not found'};
    }
  }

  // Get the status of a transaction
  async getTransactionStatus(transactionId) {
    const transaction = this.pendingTransactions.get(transactionId);
    if (transaction) {
      return transaction.status;
    } else {
      // Check the ledger for confirmed transactions
      const confirmedTransaction = await this.getTransactionFromLedger(
        transactionId,
      );
      if (confirmedTransaction) {
        return confirmedTransaction.status;
      } else {
        return 'not found';
      }
    }
  }

  // Get the transaction history for a user
  async getTransactionHistory(userId) {
    const history = [];
    for await (const {key, value} of this.db.createReadStream()) {
      const transaction = JSON.parse(value);
      if (
        transaction.senderId === userId ||
        transaction.receiverId === userId
      ) {
        history.push(transaction);
      }
    }
    return history;
  }

  // Get the balance of a user
  async getBalance(userId) {
    let balance = 0;
    for await (const {key, value} of this.db.createReadStream()) {
      const transaction = JSON.parse(value);
      if (transaction.senderId === userId) {
        balance -= transaction.amount;
      }
      if (transaction.receiverId === userId) {
        balance += transaction.amount;
      }
    }
    return balance;
  }

  // Update the ledger with a confirmed transaction
  async updateLedger(transaction) {
    await this.db.put(transaction.id, JSON.stringify(transaction));
  }

  // Retrieve a transaction from the ledger
  async getTransaction(transactionId) {
    try {
      const transaction = await this.db.get(transactionId);
      return JSON.parse(transaction);
    } catch (error) {
      return null;
    }
  }
}

export default TransactionManager;
