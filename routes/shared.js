module.exports = {
	connectToDB : function(){
		const mysql = require('mysql');
		const connection = mysql.createConnection({
		  host: 'localhost',
		  user: 'root',
		  password: process.env.MYSQL_PASSWORD,
		  database: 'redomedica'
		})
		connection.connect((err) => {
		  if (err) throw err;
		  console.log('Connected!')
		})
		return connection
	},
	query : async function(conn, query, data){
		return new Promise(async (resolve, reject) => { 
			if(!data)
				await conn.query(query, (err,res) => {
					console.log(res)
					if(err) throw reject(err);
					resolve(res)
				})
			else
				await conn.query(query, data, (err,res) => {
					console.log(res)
					if(err) throw reject(err);
					resolve(res)
				})
		})
	}
}
