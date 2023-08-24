
/**
 * 
 * @param {string} actor // Actor identifier
 * @param {string} issuer // Actor identity issuer
 * @param {string} contents // Dialog message contents (in turtle format)
 * @param {string} question // Dialog message question (as a log:onQuestionSurface - log:onAnswerSurface )
 * @returns // The formatted dialog message
 */
export function generateDialogMessage(actor, issuer, client, endpoint, contents, questions, warnings) { 
    return (
`@prefix ex: <http://example.org/> .
@prefix dialog: <urn:dialog:> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

# Message context
() dialog:onVerifiedSurface {
    <urn:dialog:message:${Date.now().toString()}> a dialog:DialogMessage;
    dialog:actor <${actor}>;
    dialog:issuer <${issuer}>;
    dialog:client <${client}>;
    dialog:endpoint <${endpoint}>;
    dialog:contents <>.
}.

# Message data
${contents.trim()}

# Message questions
${questions.trim()}

${
    warnings && warnings.trim() && 
`# Debug information
() dialog:onDebugSurface {
${warnings.trim()}
}.`}`
    )
}
