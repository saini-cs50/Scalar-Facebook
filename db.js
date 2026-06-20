

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'data', 'db.json');

function initializeDatabase() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(DB_FILE)) {
    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('admin123', salt);
    const guestPasswordHash = bcrypt.hashSync('guest123', salt);

    const initialData = {
      users: [
        {
          id: "user_admin",
          username: "alice_dev",
          name: "Alice Developer",
          password: adminPasswordHash,
          avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AD&backgroundType=solid&backgroundColor=1b263b"
        },
        {
          id: "user_learner",
          username: "guest_learner",
          name: "Guest Learner",
          password: guestPasswordHash,
          avatar: "https://api.dicebear.com/7.x/initials/svg?seed=GL&backgroundType=solid&backgroundColor=415a77"
        }
      ],
      posts: [
        {
          id: "post_1",
          userId: "user_admin",
          content: "Welcome to Scalar Facebook! The database is initialized and active. Post updates or announcements here.",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          likes: 3,
          comments: []
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function readData() {
  initializeDatabase();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading DB file:', error);
    return { users: [], posts: [] };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing DB file:', error);
    return false;
  }
}

const db = {
  getUser(userId) {
    const data = readData();
    return data.users.find(u => u.id === userId);
  },

  findByUsername(username) {
    const data = readData();
    return data.users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
  },

  registerUser(name, username, password) {
    const data = readData();
    
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    const newUser = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      username: username.toLowerCase().trim(),
      name: name.trim(),
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${initials || 'US'}&backgroundType=solid&backgroundColor=1b263b`
    };
    
    data.users.push(newUser);
    writeData(data);
    return newUser;
  },
  getPosts() {
    const data = readData();
    return data.posts
      .map(post => {
        const user = data.users.find(u => u.id === post.userId) || {
          name: "Deleted User",
          avatar: "https://api.dicebear.com/7.x/initials/svg?seed=DU&backgroundType=solid&backgroundColor=778da9"
        };
        return { ...post, user };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  createPost(userId, content) {
    const data = readData();
    const newPost = {
      id: 'post_' + Math.random().toString(36).substring(2, 9),
      userId,
      content,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: []
    };
    
    data.posts.push(newPost);
    writeData(data);
    return newPost;
  }
};

module.exports = db;
