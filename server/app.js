import express from 'express';
import 'dotenv/config';
import bodyParser from 'body-parser';
import { spawn } from 'child_process';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.route('/csr').get((req, res) => {
  try {
    const child_process = spawn('node', [
      path.join('dist', 'tasks', 'CsrTask', 'index.js'),
      'fdas123321fads',
    ]);

    child_process.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    child_process.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    child_process.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });

    return res.json({ message: 'Scrape CSR task started successfully' });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'Error starting scrape CSR task' }).status(500);
  }
});

app.route('/ssr').get((req, res) => {
  try {
    spawn.join('node', [
      path('..', 'dist', 'tasks', 'SsrTask', 'index.js'),
      'fdas123321fads',
    ]);

    child_process.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    child_process.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    child_process.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });

    return res.json({ message: 'Scrape SSR task started successfully' });
  } catch (error) {
    console.log(error);
    return res.json({ message: 'Error starting scrape SSR task' }).status(500);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
