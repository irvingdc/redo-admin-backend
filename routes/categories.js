var express = require('express')
var router = express.Router()
const mysql = require('mysql')
const fn = require('./shared')

async function getCategories(req, res) {
	let conn = fn.connectToDB()
	let categories = await fn.query(conn,"SELECT * FROM Category;")
	res.send({ success : true, data : categories })
}

async function getCategory(req, res){
	let conn = fn.connectToDB()
	let id = req.params.id
	let categories = await fn.query(conn,"SELECT * FROM Category where id=?;", [id])
	if(categories.length) res.send({ success : true, data : categories[0] })
	else res.send({ success : false, data : null })
	conn.end()
}

async function addCategory(req, res) {
	let conn = fn.connectToDB()
	let name = req.body.name
	let abreviation = req.body.abreviation
	let queryResult = await fn.query(conn,"INSERT INTO Category(name,abreviation) VALUES(?,?);", [name,abreviation])
	res.send({ success : true, data : queryResult["insertId"] })
	conn.end()
}

async function updateCategory(req, res) {
	let conn = fn.connectToDB()
	let id = req.params.id
	let name = req.body.name
	let abreviation = req.body.abreviation
	await fn.query(conn,"UPDATE Category SET name=?, abreviation=? WHERE id=?;", [name, abreviation, id])
	res.send({ success : true, data : null })
	conn.end()
}

async function deleteCategory(req, res) {
	let conn = fn.connectToDB()
	let id = req.params.id
	await fn.query(conn,"DELETE FROM Category where id=?;", [id])
	res.send({ success : true, data : null })
	conn.end()
}

router.get('/', (req, res) => { 
	try { getCategories(req,res) }
	catch(e){ res.send({ success : false, data : null }) }
})
router.get('/:id', (req, res) => { 
	try { getCategory(req,res) }
	catch(e){ res.send({ success : false, data : null }) }
})
router.post('/', (req, res) => { 
	try { addCategory(req,res) }
	catch(e){ res.send({ success : false, data : null }) }
})
router.delete('/:id', (req, res) => { 
	try { deleteCategory(req,res) }
	catch(e){ res.send({ success : false, data : null }) }
})
router.put('/:id', (req, res) => { 
	try { updateCategory(req,res) }
	catch(e){ res.send({ success : false, data : null }) }
})

module.exports = router; 