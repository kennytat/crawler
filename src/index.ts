import * as fs from 'fs'
import * as path from 'path'
import PQueue from 'p-queue';
import { exec, spawn, execSync, spawnSync } from 'child_process'
import fetch from 'node-fetch';
const queue = new PQueue();
queue.on('add', () => {
  console.log(`Task is added.  Size: ${queue.size}  Pending: ${queue.pending}`);
});
queue.on('next', () => {
  console.log(`Task is completed.  Size: ${queue.size}  Pending: ${queue.pending}`);
});
queue.on('idle', () => {
  console.log(`Queue is idle.  Size: ${queue.size}  Pending: ${queue.pending}`);
});

// edit info here
// const prefix = '/home/vgm/Desktop';
const args = process.argv.slice(2)
const concurrency = parseInt(args[0].replace('concurrency=', '')) || 1;
const startPoint = parseInt(args[1].replace('start=', ''));
const endPoint = parseInt(args[2].replace('end=', ''));
queue.concurrency = concurrency

const destFolder = '/Users/Kenny_Tat/Desktop/sachnoi.com.vn'

const main = async () => {
  const raw = await fs.readFileSync(`${__dirname}/database/data.json`, { encoding: 'utf8' });
  const json = JSON.parse(raw);
  try {
    for (let i = startPoint; i < (endPoint || json.length); i++) {
      (async () => {
        queue.add(async () => {
          const dir = `${destFolder}/${json[i].title}`
          await execSync(`mkdir -p "${dir}"`);
          const desriptionPath = `${dir}/description.txt`
          await fs.appendFileSync(`${desriptionPath}`, json[i].description);
          await execSync(`pandoc -s "${desriptionPath}" -o "${desriptionPath.replace(/\.txt$/, '.docx')}"`)
          await fs.unlinkSync(desriptionPath);
          // let url:string = '';
          let promises: any = [];
          json[i].links.forEach(async (link) => {
            // url = url + `"${link}" `
            // await exec(`wget "${link}" -P "${dir}"`)
            promises.push(new Promise(async (resolve, reject) => {
              // await execSync(`wget "${link}" -P "${dir}"`)
              // resolve('done')
              const ls = spawn('wget', [link, '-P', dir]);
              ls.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
              });
              ls.on('close', (code) => {
                console.log('spawn finish');
                resolve('done')

              });
            }));
          })
          await Promise.all(promises).then(() => console.log('promise done'))
        });
      })();
    }
  } catch (error) {
    console.log(error);
  }
}

main();