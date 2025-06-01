import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = "locations.sqlite "; 
const SQL_CREATE_ENTRIES = `
    CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY autoincrement,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
    );
`;

let _db = null; 

export default function openDB() { 
if(!_db) { 
_db = SQLite.openDatabaseSync(DATABASE_NAME);
_db.withTransactionSync (() => { 
_db.execSync(SQL_CREATE_ENTRIES);
} ) ;
}
return _db; 
}