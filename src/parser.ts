/**
 * Copyright 2020 Achilles CSV Parser Project Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @license
 */

interface AnyObject {
  [key: string]: any;
}
type Reviver = (k: string, v: string) => any;

export function parse(string: string, reviver?: Reviver): AnyObject[] {
  const rows: AnyObject[] = [];

  const keys: string[] = [];
  let keysParsed = false;

  // Number of values encountered for current row. Used to index the |keys|
  // array.
  let gatheredValues = 0;
  let row: AnyObject = {};

  let lastDelimiter = -1;
  let i = 0;
  let inQuotes = false;
  let escapedDoubleQuotes = false;

  function gatherValue(): void {
    const offset = string[i - 1] === '"' ? 1 : 0;
    let value = string.substring(lastDelimiter + 1 + offset, i - offset);
    if (escapedDoubleQuotes) {
      // Only attempt to remove escaped double quotes, if they were actually
      // found, since this is quite costly.
      value = value.replace(/""/g, '"');
    }

    if (!keysParsed) {
      keys.push(value);
    } else {
      // TODO: assert(gatheredValues < keys.length);

      if (!reviver) {
        row[keys[gatheredValues]] = value;
      } else {
        const revived = reviver(keys[gatheredValues], value);
        if (revived !== undefined) {
          row[keys[gatheredValues]] = revived;
        }
      }

      gatheredValues++;
    }

    escapedDoubleQuotes = false;
    lastDelimiter = i;
  }

  function gatherRow(): void {
    gatherValue();
    if (!keysParsed) {
      keysParsed = true;
      return;
    }

    rows.push(row);
    row = {};
    gatheredValues = 0;
  }

  while (i < string.length) {
    const current = string[i];

    if (!inQuotes) {
      if (current === ',') {
        // End of value detected.
        gatherValue();
      } else if (current === '"') {
        inQuotes = true;
      } else if (current === '\r') {
        // assert next is \n
        // End of row detected, store row and continue.
        gatherRow();
        // Go past the \n.
        i++;
        lastDelimiter = i;
      } else if (current === '\n') {
        // End of row detected, store row and continue.
        gatherRow();
      } else if (i === string.length - 1) {
        // End of file reached, last line does not have \n.
        i++;
        gatherRow();
      }
      i++;
      continue;
    }

    // In double quotes.
    if (current !== '"') {
      i++;
      continue;
    }

    const next = string[i + 1];
    if (next === '"') {
      // Two adjacent (aka escaped) double quotes found. Skipping over and
      // dealing with them in |gatherValue|.
      i += 2;
      escapedDoubleQuotes = true;
    } else {
      // Closing double quote detected.
      inQuotes = false;
      i++;

      // End of file reached, last line does not have \n.
      if (i === string.length) {
        gatherRow();
      }
    }
  }

  return rows;
}
