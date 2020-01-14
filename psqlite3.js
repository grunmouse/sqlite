const sqlite3 = require('sqlite3');

class Statement{
	constructor(stmt){
		this.stmt = stmt;
	}
}

/* Методы оператора, оборачиваемые в Promise с самовозвратом*/
[
	'bind',
	'reset',
	'finalize',
	'run',
	'each'
].forEach((method)=>{
	Statement.prototype[method] = function(...args){
		return new Promise((resolve, reject)=>{
			this.stmt[method](...args, (err, result)=>{
				if(err){
					reject(err);
				}
				else{ 
					resolve(this);
				}
			});
		});
	};
});

/* Методы оператора, оборачиваемые в Promise без дополнительной обработки*/
[
	'get',
	'all'
].forEach((method)=>{
	Statement.prototype[method] = function(...args){
		return new Promise((resolve, reject)=>{
			this.stmt[method](...args, (err, result)=>{
				if(err){
					reject(err);
				}
				else{ 
					resolve(result);
				}
			});
		});
	};
});

class Database{
	constructor(cached){
		this.cached = cached || false;
	}
	
	open(...args){
		const DBDriver = this.cached ? sqlite3.cached.Database : sqlite3.Database;
		let driver;
		return new Promise((resolve, reject)=>{
			const done = (err)=>{err!=null ? reject(err) : resolve(driver)};
			driver = new DBDriver(...args, (err)=>{
				if(err){
					reject(err);
				}
				else{
					resolve();
				}
			});
		})
		.then(()=>{
			this.driver = driver;
			return this;
		});
	}
	
	configure(option, value){
		if(!this.driver){
			throw new Error('Database is not opened');
		}
		this.driver.configure(option, value);
	}

	prepare(...args){
		if(!this.driver){
			throw new Error('Database is not opened');
		}
		return new Promise((resolve, reject)=>{
			let stmt = this.driver.prepare(...args, (err)=>{
				if(err){
					reject(err);
				}
				else{
					resolve(new this.Statement(stmt));
				}
			});
		});
	}
	
 /**
   * Register listeners for Sqlite3 events
   *
   * @param {'trace'|'profile'|'error'|'open'|'close'} eventName
   * @param {() => void} listener trigger listener function
   */
  on(eventName, listener) {
    this.driver.on(eventName, listener);
  }
}


Database.prototype.Statement = Statement;

/* Свойства базы данных, пробрасываемые как есть */
[
	'lastID',
	'changes',
	'sql'
].forEach((prop)=>{
	Object.defineProperty(Database.prototype, prop,	{
		get:function(){
			return this.driver && this.driver[prop]
		}
	})
});

/* Методы базы данных, оборачиваемые в Promise без дополнительной обработки*/
[
	'close',
	'run',
	'get',
	'all',
	'each',
	'exec'
].forEach((method)=>{
	Database.prototype[method] = function(...args){
		if(!this.driver){
			throw new Error('Database is not opened');
		}
		return new Promise((resolve, reject)=>{
			this.driver[method](...args, (err, result)=>{
				if(err){
					reject(err)
				}
				else{ 
					resolve(result)
				}
			});
		});
	};
});

module.exports = {
	sqlite3,
	Database,
	Statement
};