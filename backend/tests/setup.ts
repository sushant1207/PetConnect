// Jest setup file
import mongoose from 'mongoose';

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock nodemailer to prevent actual email sending during tests
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}));

// Clean up after all tests
afterAll(async () => {
  // Close any open mongoose connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
