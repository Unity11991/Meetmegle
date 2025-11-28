const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/users.json');

// Ensure data directory and file exist
if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]');
}

class User {
    constructor(data) {
        this._id = data._id || Date.now().toString();
        this.username = data.username;
        this.email = data.email;
        this.password = data.password;
        this.avatarUrl = data.avatarUrl || '';
    }

    static _readData() {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            return [];
        }
    }

    static _writeData(data) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    }

    async save() {
        const users = User._readData();
        // Convert this instance to a plain object to save
        const userObj = {
            _id: this._id,
            username: this.username,
            email: this.email,
            password: this.password,
            avatarUrl: this.avatarUrl
        };
        users.push(userObj);
        User._writeData(users);
        return this;
    }

    static findOne(query) {
        const users = User._readData();
        let user;
        if (query.$or) {
            user = users.find(u => query.$or.some(q => Object.keys(q).every(k => u[k] === q[k])));
        } else {
            user = users.find(u => Object.keys(query).every(k => u[k] === query[k]));
        }
        return user ? new User(user) : null;
    }

    static findById(id) {
        const users = User._readData();
        const user = users.find(u => u._id === id);
        const result = user ? new User(user) : null;

        const promise = Promise.resolve(result);
        promise.select = (fields) => {
            if (!result) return Promise.resolve(null);
            if (fields === '-password') {
                const { password, ...rest } = result;
                return Promise.resolve(rest);
            }
            return Promise.resolve(result);
        };
        return promise;
    }

    static findByIdAndUpdate(id, update, options) {
        const users = User._readData();
        const index = users.findIndex(u => u._id === id);

        if (index === -1) {
            const promise = Promise.resolve(null);
            promise.select = () => Promise.resolve(null);
            return promise;
        }

        const updatedUser = { ...users[index], ...update };
        users[index] = updatedUser;
        User._writeData(users);

        const result = new User(updatedUser);
        const promise = Promise.resolve(result);
        promise.select = (fields) => {
            if (fields === '-password') {
                const { password, ...rest } = result;
                return Promise.resolve(rest);
            }
            return Promise.resolve(result);
        };
        return promise;
    }
}

module.exports = User;
