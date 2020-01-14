const psqlite3 = require('./psqlite3.js');
const fsp = require('fs').promises;
const Path = require('path');
const res = process.argv[process.execArgv.length+1];



class Database extends psqlite3.Database {

	async transaction(callback){
		const db = this;
		try{
			await db.run('BEGIN EXCLUSIVE TRANSACTION;');
			
			const result = await callback(db);
			
			await db.run('COMMIT TRANSACTION;');
			
			return result;
		}
		catch(e){
			await db.run('ROLLBACK TRANSACTION;');
			//console.log(e);
			throw new Error(e);
		}
	}
		
	async runFile(path){
		const db = this;
		let code = await fsp.readFile(path, {encoding:'utf8'});
		code = code
			.replace(/--.*/g, '')
			.replace(/\/\*(?:[^*]*|\*(?!\/))*\*\//g, '');
		
		const query = code.split(';');
		let result;
		for(let q of query){
			//console.log(q);
			q = q.trim();
			if(q){
				result = await db.run(q+';');
			}
		}
		return result;
	}
		
	runResource(path){
		return this.runFile(Path.join(res, '..', '..', path));
	}
	
}

module.exports = Database;