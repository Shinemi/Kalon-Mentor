const request = require('supertest')
const app = require('../app')
const db = require('../db/db')


const TEST_EMAIL = 'test.jest@kalonmentor.local'
const TEST_PASSWORD = 'motdepasse123!'