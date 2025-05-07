import express from 'express';
import { connect } from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import common from '@recipe-explorer/common';

const app = express();
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false, store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/recipe-explorer' }) }));

app.get('/', (req, res) => res.send('API is running'));
const PORT = 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
