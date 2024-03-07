import express from 'express';
import 'dotenv/config';
import bodyParser from 'body-parser';
import { spawn } from 'child_process';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.route('/csr').post((req, res) => {
  const id = req.body.id;
  const website = req.body.website;
  try {
    console.log('Starting CSR task');
    const child_process = spawn('node', [
      path.join('dist', 'tasks', 'CsrTask', 'index.js'),
      id,
      website,
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
    return res.status(500).json({ message: 'Error starting scrape CSR task' });
  }
});

app.route('/ssr').post((req, res) => {
  const id = req.body.id;
  const website = req.body.website;
  try {
    const child_process = spawn('node', [
      path.join('dist', 'tasks', 'SsrTask', 'index.js'),
      id,
      website,
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
    return res.status(500).json({ message: 'Error starting scrape SSR task' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
