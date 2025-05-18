// storage.js

class Storage {
    constructor() {
      // Map canvasId -> Set of userIds connected to that canvas
      this.canvasUsers = new Map();
  
      // Map canvasId -> Array of drawData objects
      this.canvasDrawings = new Map();
    }
  
    // Add user to canvas
    addUserToCanvas(canvasId, userId) {
      if (!this.canvasUsers.has(canvasId)) {
        this.canvasUsers.set(canvasId, new Set());
      }
      this.canvasUsers.get(canvasId).add(userId);
    }
  
    // Remove user from canvas
    removeUserFromCanvas(canvasId, userId) {
      if (this.canvasUsers.has(canvasId)) {
        this.canvasUsers.get(canvasId).delete(userId);
        if (this.canvasUsers.get(canvasId).size === 0) {
          this.canvasUsers.delete(canvasId);
        }
      }
    }
  
    // Get all users connected to a canvas
    getUsersByCanvas(canvasId) {
      return this.canvasUsers.has(canvasId) 
        ? Array.from(this.canvasUsers.get(canvasId)) 
        : [];
    }
  
    // Add drawing to a canvas
    addDrawingToCanvas(canvasId, drawData) {
      if (!this.canvasDrawings.has(canvasId)) {
        this.canvasDrawings.set(canvasId, []);
      }
      this.canvasDrawings.get(canvasId).push(drawData);
    }
  
    // Get all drawings for a canvas
    getDrawingsByCanvas(canvasId) {
      return this.canvasDrawings.has(canvasId)
        ? this.canvasDrawings.get(canvasId)
        : [];
    }
  
    // Get all canvas IDs currently stored
    getAllCanvasIds() {
      return Array.from(new Set([
        ...this.canvasUsers.keys(),
        ...this.canvasDrawings.keys(),
      ]));
    }
  
    // Get all users across all canvases (unique)
    getAllUsers() {
      const userSet = new Set();
      for (const users of this.canvasUsers.values()) {
        for (const u of users) userSet.add(u);
      }
      return Array.from(userSet);
    }
  
    // Optionally clear all data for a canvas
    clearCanvas(canvasId) {
      this.canvasUsers.delete(canvasId);
      this.canvasDrawings.delete(canvasId);
    }
  }
  
  module.exports = new Storage();
  