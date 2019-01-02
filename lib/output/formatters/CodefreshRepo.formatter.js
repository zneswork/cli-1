const { Formatter, Style} = require('../../output');


const FORMATTER = Formatter.build()
    .style('git_context', Style.gray)
    .style('name_id', Style.cyan);

module.exports = FORMATTER;