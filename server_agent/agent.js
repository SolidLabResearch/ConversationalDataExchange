import * as http from "http"
import { program } from "commander"
import { exec } from "child_process"
import { existsSync, mkdirSync, readFile, readFileSync, writeFileSync } from "fs"
import path from "path"
import { generateDialogMessage } from "./generate_dialog_message.js"

let intermediateDir = path.join(process.cwd(), '.intermediary/')
    
let message_file = path.join(intermediateDir, "message.n3s")
let message_data = path.join(intermediateDir, "message_data.n3s")
let message_context = path.join(intermediateDir, "message_context.n3s")
let message_questions = path.join(intermediateDir, "message_questions.n3s")
let intermediate_output = path.join(intermediateDir, "intermediate_output.n3s")
let output_data = path.join(intermediateDir, "output_data.n3s")
let output_questions = path.join(intermediateDir, "output_questions.n3s")
let output_warnings = path.join(intermediateDir, "output_warnings.n3s")
let output_results = path.join(intermediateDir, "output_results.n3s")

program
.option('-p, --port <char>')
.option('-c , --config <char>')
.action(async (options) => { 
    let port = options.port || 3456
    http.createServer(async function (req, res) {
        console.log('Message received')
        let body = await extractBody(req);
        let config = JSON.parse(readFileSync(options.config))
        let responseMessage = await processIncomingMessage(body, config)
        res.setHeader('Content-Type', "text/n3")
        res.write(responseMessage)
        res.end();

        // exec(`rm -r ${intermediateDir}`)
        
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

async function processIncomingMessage(body, config) { 
    console.log('handling incoming message')

    if (!existsSync(intermediateDir)) { 
        mkdirSync(intermediateDir)
    }

    writeFileSync(message_file, body, { encoding: "utf-8" })
    
    console.log('# Extract message information')
    await writeProcessToFile(`eye --quiet --nope --blogic --no-qnames ${message_file} ./rules/process_message/unpack_message_context.n3`, message_context)
    await writeProcessToFile(`eye --quiet --nope --blogic --no-qnames ${message_file} ./rules/process_message/unpack_message_data.n3`, message_data)
    await writeProcessToFile(`eye --quiet --nope --blogic --no-qnames ${message_file} ./rules/process_message/unpack_message_questions.n3`, message_questions)


    console.log('# Evaluate policies to calculate available data')

    await writeProcessToFile(`eye --quiet --nope --blogic --no-qnames  ./data/* ${message_data} ${message_context} ./rules/agent_rules/*`, intermediate_output)

    await writeProcessToFile(`eye --quiet --nope --blogic --no-qnames ${intermediate_output} ./rules/extract_results/display_data.n3`, output_data)
    await writeProcessToFile(`eye --quiet --nope --blogic --no-qnames ${intermediate_output} ./rules/extract_results/display_warnings.n3`, output_warnings)
    await writeProcessToFile(`eye --quiet --nope --blogic --no-qnames ${intermediate_output} ./rules/extract_results/extract_questions.n3`, output_questions)

    console.log('# Evaluate message query over available data')
    
    await writeProcessToFile(`eye --quiet --nope --blogic --no-qnames ${message_context} ${message_questions} ${output_data} ./rules/output_data/*`, output_results)

    console.log('# Formulate response')


    let contents = readFileSync(output_results, { encoding: "utf-8" })
    let questions = readFileSync(output_questions, { encoding: "utf-8" })
    let warnings = readFileSync(output_warnings, { encoding: "utf-8" })

    contents = contents.replace(/^@prefix.*$\n/gm, '');
    questions = questions.replace(/^@prefix.*$\n/gm, '');
    warnings = warnings.replace(/^@prefix.*$\n/gm, '');

    // This is still hard-coded
    let responseMessage = generateDialogMessage(
        config.actor,
        config.issuer,
        config.client,
        config.endpoint,
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