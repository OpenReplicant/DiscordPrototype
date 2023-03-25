const fs = require('fs');
const path = require('path');
const { copyFileSync } = require('fs');

module.exports = {
  checkFirstInteraction,
  banUser,
  checkBanStatus,
};

const userDataPath = './user';
const userDataFile = 'users.json';
const banListPath = './';
const banListFile = 'ban-list.json';
const characterFile = './character.json';
const chatLog = './chatlog.txt';

// Function to check if it's the first time a user interacts
function checkFirstInteraction(user) {
  const userId = user.id;
  const userData = getUserData();

  if (userData.indexOf(userId) === -1) {
    // Run new user function
    newUser(userId);
    return true;
  } else {
    return false;
  }
}

// Function to create a new user folder, add user ID to array, and copy character.json file
function newUser(userId) {
  const userDirectory = path.join(userDataPath, userId);
  fs.mkdirSync(userDirectory);
  copyFileSync(characterFile, path.join(userDirectory, 'character.json'));
  copyFileSync(chatLog, path.join(userDirectory, 'chatlog.txt'));
  const userData = getUserData();
  userData.push(userId);
  saveUserData(userData);
}

// Function to retrieve user data array from disk
function getUserData() {
  let userData = [];
  try {
    const usersFile = path.join(userDataPath, userDataFile);
    if (fs.existsSync(usersFile)) {
      userData = JSON.parse(fs.readFileSync(usersFile));
    }
  } catch (error) {
    console.error(error);
  }
  return userData;
}

// Function to save user data array to disk
function saveUserData(userData) {
  const usersFile = path.join(userDataPath, userDataFile);
  fs.writeFileSync(usersFile, JSON.stringify(userData), (err) => {
    if (err) console.error(err);
  });
}

// Function to ban a user
function banUser(userId) {
  const banList = getBanList();
  if (banList.indexOf(userId) === -1) {
    banList.push(userId);
    saveBanList(banList);
  }
}

// Function to retrieve ban list array from disk
function getBanList() {
  let banList = [];
  try {
    const banListFilepath = path.join(banListPath, banListFile);
    if (fs.existsSync(banListFilepath)) {
      banList = JSON.parse(fs.readFileSync(banListFilepath));
    }
  } catch (error) {
    console.error(error);
  }
  return banList;
}

// Function to save ban list array to disk
function saveBanList(banList) {
  const banListFilepath = path.join(banListPath, banListFile);
  fs.writeFileSync(banListFilepath, JSON.stringify(banList), (err) => {
    if (err) console.error(err);
  });
}

// Function to check if a user is banned
function checkBanStatus(user) {
  const userId = user.id;
  const banList = getBanList();
  return banList.indexOf(userId) !== -1;
}
