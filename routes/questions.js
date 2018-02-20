var express = require('express')
var router = express.Router()
const mysql = require('mysql')
const fn = require('./shared')

async function getQuestions(req, res) {

	let conn = fn.connectToDB()
	let questions, category = req.query.category
	if(!category) questions = await fn.query(conn,"SELECT id, description, categoryId FROM Question;")
	else questions = await fn.query(conn,"SELECT * FROM Question WHERE categoryId=?;",[category])

	if(questions.length)
		questions.forEach( async (question, index)=>{
			question.answers = await fn.query(conn,"SELECT id, description, justification, questionId FROM Answers WHERE questionId=?;",[question.id])
			let correctAnswer = await fn.query(conn,"SELECT * FROM CorrectAnswers WHERE questionId=?;",[question.id])
			let category = await fn.query(conn,"SELECT * FROM Category WHERE id=?;",[question.categoryId])
			if(question.categoryId && category.length) question.category = category[0]
			if(correctAnswer.length)
				question.answers.find(it=>{ return it.id == correctAnswer[0].answerId }).isCorrectAnswer = true
			if(index+1 == questions.length){
				res.send({ success : true, data : questions })
				conn.end()
			}
		})
	else {
		res.send({ success : true, data : questions })
		conn.end()
	}
}

async function getQuestion(req, res){

	let conn = fn.connectToDB()
	let id = req.params.id
	let questions = await fn.query(conn,"SELECT * FROM Question WHERE id=?;",[id])

	if(questions.length){
		question = questions[0]
		question.answers = await fn.query(conn,"SELECT * FROM Answers WHERE questionId=?;",[id])
		let correctAnswer = await fn.query(conn,"SELECT * FROM CorrectAnswers WHERE questionId=?;",[id])
		let category = await fn.query(conn,"SELECT * FROM Category WHERE id=?;",[question.categoryId])
			if(question.categoryId && category.length) question.category = category[0]
		if(correctAnswer.length) question.answers.find(it=>{ return it.id == correctAnswer[0].answerId }).isCorrectAnswer = true
		res.send({ success : true, data : question })
		conn.end()
	}
	else{
		res.send({ success : false, data : null })
		conn.end()
	}

}

async function addQuestion(req, res) {
	let conn = fn.connectToDB()
	let description = req.body.description
	let answers = req.body.answers
	let categoryId = req.body.category ? req.body.category.id : null
	let image = req.body.imageData
	
	let categories = await fn.query(conn,"SELECT * FROM Category WHERE id=?;",[categoryId])
	if(!categories.length) categoryId = null

	let queryResult = await fn.query(conn,"INSERT INTO Question(description,categoryId,image) VALUES(?,?,?);", [description, categoryId, image])
	let questionId = queryResult["insertId"]

	answers.forEach( async (answer,index)=>{
		queryResult = await fn.query(conn,"INSERT INTO Answers(description,justification,image,questionId) VALUES(?,?,?,?);", [answer.description, answer.justification, answer.imageData, questionId])
		if(answer.isCorrectAnswer) await fn.query(conn,"INSERT INTO CorrectAnswers(answerId,questionId) VALUES(?,?);", [queryResult["insertId"], questionId])
		if(index+1 == answers.length){
			res.send({ success : true, data : questionId })
			conn.end()
		}
	})
}

async function updateQuestion(req, res) {
	let conn = fn.connectToDB()
	let questionId = req.params.id
	let description = req.body.description
	let answers = req.body.answers
	let categoryId = req.body.category ? req.body.category.id : null
	let image = req.body.imageData

	let categories = await fn.query(conn,"SELECT * FROM Category WHERE id=?;",[categoryId])
	if(!categories.length) categoryId = null

	await fn.query(conn,"UPDATE Question SET description=?, categoryId=?, image=? WHERE id=?;", [description, categoryId, image, questionId])
	await fn.query(conn,"DELETE FROM CorrectAnswers WHERE questionId=?;", [questionId])
	await fn.query(conn,"DELETE FROM Answers WHERE questionId=?;", [questionId])

	answers.forEach( async (answer,index)=>{
		queryResult = await fn.query(conn,"INSERT INTO Answers(description,justification,image,questionId) VALUES(?,?,?,?);", [answer.description, answer.justification, answer.imageData, questionId])
		if(answer.isCorrectAnswer) 
			await fn.query(conn,"INSERT INTO CorrectAnswers(answerId,questionId) VALUES(?,?);", [queryResult["insertId"], questionId])
		if(index+1 == answers.length){
			res.send({ success : true, data : null })
			conn.end()
		}
	})
}

async function deleteQuestion(req, res) {
	let conn = fn.connectToDB()
	let questionId = req.params.id
	await fn.query(conn,"DELETE FROM CorrectAnswers WHERE questionId=?;", [questionId])
	let answers = await fn.query(conn,"SELECT * FROM Answers WHERE questionId=?;",[questionId])
	if(answers.length) answers.forEach( async (answer,index)=>{
		await fn.query(conn,"DELETE FROM Answers where id=?;", [answer.id])
		if(index+1 == answers.length){
			await fn.query(conn,"DELETE FROM Question where id=?;", [questionId])
			res.send({ success : true, data : null })
			conn.end()
		}
	})
	else{
		await fn.query(conn,"DELETE FROM Question where id=?;", [questionId])
		res.send({ success : true, data : null })
		conn.end()
	}
}

router.get('/', (req, res) => { 
	try{ getQuestions(req,res)  }
	catch(e){ res.send({ success : false, data : null }) }
})
router.get('/:id', (req, res) => { 
	try{ getQuestion(req,res) }
	catch(e){ res.send({ success : false, data : null }) }
})
router.post('/', (req, res) => { 
	try{ addQuestion(req,res) }
	catch(e){ res.send({ success : false, data : null }) }
})
router.delete('/:id', (req, res) => { 
	try{ deleteQuestion(req,res) }
	catch(e){ res.send({ success : false, data : null }) }
})
router.put('/:id', (req, res) => { 
	try{ updateQuestion(req,res) }
	catch(e){ res.send({ success : false, data : null }) }
})

module.exports = router; 