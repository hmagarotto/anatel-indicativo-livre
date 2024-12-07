import states_ab2 from './classe-ab2.json' assert { type: 'json' };
import states_ab3 from './classe-ab3.json' assert { type: 'json' };
import states_c from './classe-c.json' assert { type: 'json' };
import { readFileSync, writeFileSync } from 'fs';

const file_preamble = `Gerado por Henrique PU2WHM em ${(new Date()).toLocaleDateString()}\nsite: www.pu2whm.com\n`;

function replaceChar(origString, replaceChar, index) {
    return origString.substr(0, index) + replaceChar + origString.substr(index + 1);
}

function incrementSuffix(suffix) {
    const z_code = 'Z'.codePointAt(0);
    let pos = suffix.length - 1;
    while (pos >= 0) {
        let code = suffix.codePointAt(pos);
        code++;
        if (code <= z_code) {
            suffix = replaceChar(suffix, String.fromCodePoint(code), pos);
            break;
        }
        suffix = replaceChar(suffix, 'A', pos);
        pos--;
    }
    return suffix;
}

function generateSuffixes(suffix_start, suffix_end) {
    const result = [ suffix_start ];
    while (suffix_start !== suffix_end) {
        suffix_start = incrementSuffix(suffix_start);
        result.push(suffix_start);
    }
    return result;
}

function generateSuffixesByRangeList(suffix_ranges) {
    const result = [  ];
    for (const range of suffix_ranges) {
        result.push(... generateSuffixes(range.suffix_start, range.suffix_end));
    }
    return result;
}

const used = new Set(readFileSync('used.txt').toString('UTF8').split('\n'));
const classes = {
    'AB2': states_ab2,
    'AB3': states_ab3,
    'C': states_c,
}
const prohibited = new Set([
    'DDD', 'PAN', 'RRR', 'SNM', 'SOS', 'SVH', 'TTT', 'XXX',
    ... generateSuffixes('QAA', 'QZZ')
]);

for (const classe in classes) {
    const states = classes[classe];
    for (const state of states) {
        let suffixes = generateSuffixesByRangeList(state.suffix_ranges)
            .filter(callsign =>  !prohibited.has(callsign.substr(-3)))
            .sort();
        suffixes = [... new Set(suffixes)]

        state.callsigns = suffixes
            .map(suffix => `${state.prefix}${state.region}${suffix}`);
        state.free_callsigns = state.callsigns
            .filter(callsign => !used.has(callsign));
    }
}

const report = {};
for (const classe in classes) {
    const states = classes[classe];
    for (const state of states) {
        let text = '';
        const first_callsign = state.free_callsigns[0];
        let prefix = first_callsign.substr(0,first_callsign.length-1);
        let expected_last_char = 'A';
        for (const callsign of state.free_callsigns) {
            if (!callsign.startsWith(prefix)) {
                text = `${text}\n`;
                prefix = callsign.substr(0, callsign.length-1);
                expected_last_char = 'A';
            }
            // while (!callsign.endsWith(expected_last_char)) {
            //     text = `${text}\;`;
            //     expected_last_char = incrementSuffix(expected_last_char);
            // }
            text = `${text}${callsign};`;
        }
        const file_name = `classe ${classe} - ${state.state}.csv`;
        const file_metadata = `classe: ${classe}\nestado: ${state.state}\n`
        writeFileSync(`callsign-free/${file_name}`, `${file_preamble}${file_metadata}\n\n\n${text}`);
        //console.log(`classe ${classe} - ${state.state}: ${state.free_callsigns.length}/${state.callsigns.length} (${ Number(100*state.free_callsigns.length/state.callsigns.length).toFixed(1) }%)`)
        report[state.state] = report[state.state] || {};
        report[state.state][classe] = {
            total: state.callsigns.length,
            free: state.free_callsigns.length,
            pct: Number(100*state.free_callsigns.length/state.callsigns.length).toFixed(1),
            
        }
    }
}

for (const state in report) {
    process.stdout.write(`|${state}`);
    for (const classe of ['AB2', 'AB3', 'C'] ) {
        const data = report[state][classe];
        process.stdout.write(`|[**${data.pct}%**<br>${data.free}/${data.total}](https://hmagarotto.github.io/anatel-indicativo-livre/classe%20${classe}%20-%20${encodeURIComponent(state)}.csv)`);
    }
    process.stdout.write(`|\n`);
}
