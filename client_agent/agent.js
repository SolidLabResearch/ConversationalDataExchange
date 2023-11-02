import { program } from "commander"
import { SwiplEye, queryOnce } from "eyereasoner"
import { readFileSync } from "fs"
import * as http from "http"
import path from "path"
import { generateDialogMessage } from "./generate_dialog_message.js"

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

function read(...args) {
    return readFileSync(path.join(process.cwd(), ...args)).toString();
}

export async function n3reasoner(data, query, options) {
    let res = '';
    const err = [];

    const Module = await SwiplEye({
      print: (str) => { res += `${str}\n`; },
      printErr: (str) => { err.push(str); },
    });

    const args = ['--nope', '--quiet', '--no-qnames'];


    for (let i = 0; i < data.length; i += 1) {
        args.push(`data_${i}.n3s`);
        Module.FS.writeFile(`data_${i}.n3s`, data[i]);
    }

    queryOnce(Module, 'main', args);
    
    if (err.length > 0) {
        throw new Error(err.join('\n'));
    }

    return res;
}

async function processIncomingMessage(body, config) {
    console.log('# Extract message information')
    const message_context = await n3reasoner([body, read('rules', 'process_message', 'unpack_message_context.n3')]);
    const message_data = await n3reasoner([body, read('rules', 'process_message', 'unpack_message_data.n3')]);
    const message_questions = await n3reasoner([body, read('rules', 'process_message', 'unpack_message_questions.n3')]);

    console.log('# Evaluate policies to calculate available data')
    const intermediate_output = await n3reasoner([
        message_data, 
        message_context, 
        read('rules', 'agent_rules', 'hide_triples.n3'),
        read('data', 'profile.n3'),
    ]);

    const output_data = await n3reasoner([
        intermediate_output,
        read('rules', 'extract_results', 'display_data.n3'),
    ]);
    const warnings = await n3reasoner([
        intermediate_output,
        read('rules', 'extract_results', 'display_warnings.n3'),
    ]);
    const questions = await n3reasoner([
        intermediate_output,
        read('rules', 'extract_results', 'extract_questions.n3'),
    ]);

    console.log('# Evaluate message query over available data')

    console.log('contents are', JSON.stringify([
        message_context,
        message_questions,
        output_data,
        read('rules', 'output_data', 'fallback_query.n3'),
    ]))

    const contents = await n3reasoner([
        message_context,
        message_questions,
        output_data,
        read('rules', 'output_data', 'fallback_query.n3'),
    ])

    console.log('# Formulate response')

    // This is still hard-coded
    let responseMessage = generateDialogMessage(
        config.actor,
        config.issuer,
        config.client,
        config.endpoint,
        contents.replace(/^@prefix.*$\n/gm, ''),
        questions.replace(/^@prefix.*$\n/gm, ''),
        warnings.replace(/^@prefix.*$\n/gm, '')
    )

    return responseMessage
}
