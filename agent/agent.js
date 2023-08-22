import * as http from "http"
import { program } from "commander"
import { exec } from "child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import path from "path"
import { generateDialogMessage } from "./generate_dialog_message.js"

program
.option('-p, --port <char>')
.option('-d, --data <char>')
.option('-r, --rules <char>')
.action(async (options) => { 
    let port = options.port || 3456
    http.createServer(async function (req, res) {
        console.log('Message received')
        let body = await extractBody(req);
        let responseMessage = await processIncomingMessage(body, options.data, options.rules)
        res.setHeader('Content-Type', "text/n3")
        res.write(responseMessage)
        res.end();
    }).listen(port);
    console.log(`Server listening on port ${port}`)
}) 

program.parse(process.argv);


async function extractBody(req) { 
    return new Promise((resolve, reject) => { 
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', () => {
            resolve(body)
        });
        req.on('error', () => reject())
    })
}

async function processIncomingMessage(body, dataFolder, rulesFolder) { 
    console.log('handling incoming message')
    let intermediateDir = path.join(process.cwd(), '.intermediary/')
    let messageFile = path.join(intermediateDir, "message.n3s")

    if (!existsSync(intermediateDir)) { 
        mkdirSync(intermediateDir)
    }

    writeFileSync(messageFile, body, { encoding: "utf-8" })
    
    console.log('# Run 1')

    await writeProcessToFile(`eye --quiet --nope --blogic ${dataFolder}/* ${rulesFolder}/* ${messageFile} ./rules/run1/*`, path.join(intermediateDir, "output.n3s"))

    await writeProcessToFile(`eye --quiet --nope --blogic ${path.join(intermediateDir, "output.n3s")} ./rules/common/display_data.n3`, path.join(intermediateDir, "data.n3s"))
    await writeProcessToFile(`eye --quiet --nope --blogic ${path.join(intermediateDir, "output.n3s")} ./rules/common/display_warnings.n3`, path.join(intermediateDir, "warnings.n3s"))
    await writeProcessToFile(`eye --quiet --nope --blogic ${path.join(intermediateDir, "output.n3s")} ./rules/common/extract_questions.n3`, path.join(intermediateDir, "questions.n3s"))

    console.log('# Run 2')

    await writeProcessToFile(`eye --quiet --nope --blogic ${messageFile} ${path.join(intermediateDir, "data.n3s")} ./rules/run2/*`, path.join(intermediateDir, "result.n3s"))
    
    console.log()
    console.log('Result:')
    console.log('______________________')
    console.log(readFileSync(path.join(intermediateDir, "result.n3s"), { encoding: "utf-8" }))

    console.log()
    console.log()
    console.log('Warnings:')
    console.log('______________________')
    console.log(readFileSync(path.join(intermediateDir, "warnings.n3s"), { encoding: "utf-8" }))



    let contents = readFileSync(path.join(intermediateDir, "data.n3s"), { encoding: "utf-8" })
    let questions = readFileSync(path.join(intermediateDir, "questions.n3s"), { encoding: "utf-8" })
    let warnings = readFileSync(path.join(intermediateDir, "warnings.n3s"), { encoding: "utf-8" })

    contents = contents.replace(/^@prefix.*$\n/gm, '');
    questions = questions.replace(/^@prefix.*$\n/gm, '');
    warnings = warnings.replace(/^@prefix.*$\n/gm, '');

    // This is still hard-coded
    let responseMessage = generateDialogMessage(
        "https://mystore.com/profile/entity",
        "https://goverment-store-index.org/", 
        "https://mystore.com/agent/",
        "https://mystore.com/agent/endpoint/", // Not sure what we're going to do here
        contents,
        questions,
        warnings
    )

    return responseMessage
}

async function writeProcessToFile(command, file) { 
    console.log("processing command:", command)
    let dataString = await new Promise((resolve, reject) => { 
        const process = exec(command)
        let dataString = ""
        let errorString = ""
  
        process.stdout.on('data', (data) => {
            dataString += data;
        })
        
        process.stderr.on('data', (error) => {
            console.error(error);
        })
        
        process.on('exit', (code) => {
            resolve(dataString)
        }) 
    })
    writeFileSync(file, dataString, {encoding: "utf-8"})
}