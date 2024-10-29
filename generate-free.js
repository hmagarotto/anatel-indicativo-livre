import states_a from './classe-a.json' assert { type: 'json' };
import states_b from './classe-b.json' assert { type: 'json' };
import states_c from './classe-c.json' assert { type: 'json' };
import { readFileSync, writeFileSync } from 'fs';

const file_preamble = `Gerado por Henrique PU2WHM em ${(new Date()).toLocaleDateString()}
www.pu2whm.com


`;

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

const used = new Set(readFileSync('used.txt').toString('UTF8').split('\n'));
const classes = {
    'A': states_a,
    'B': states_b,
    'C': states_c,
}
const prohibited = new Set([
    'DDD', 'SNM', 'SOS', 'SVH', 'TTT', 'XXX', 'PAN', 'RRR',
    ... generateSuffixes('QAA', 'QZZ')
]);

for (const classe in classes) {
    const states = classes[classe];
    for (const state of states) {
        const suffixes = generateSuffixes(state.suffix_start, state.suffix_end)
            .filter(callsign =>  !prohibited.has(callsign.substr(-3)));
        state.callsigns = suffixes
            .map(suffix => `${state.prefix}${state.region}${suffix}`);
        state.free_callsigns = state.callsigns
            .filter(callsign => !used.has(callsign));
    }
}

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
        writeFileSync(`callsign-free/${file_name}`, `${file_preamble}${text}`);
        console.log(`classe ${classe} - ${state.state}: ${state.free_callsigns.length}/${state.callsigns.length} (${ Number(100*state.free_callsigns.length/state.callsigns.length).toFixed(1) }%)`)
    }
}