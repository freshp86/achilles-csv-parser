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
 */

function csvToArray(string: string): Array<Array<string>> {
  const rows: Array<Array<string>> = [];

  let lastDelimiter = -1;
  let inQuotes = false;

  let i = 0;
  let row: Array<string> = [];

  function gatherValue(): void {
    const offset = string[i - 1] === '"' ? 1 : 0;
    row.push(string.substring(lastDelimiter + 1 + offset, i - offset));
    lastDelimiter = i;
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
        // End of row detected, gather value and start new row.
        gatherValue();
        rows.push(row);
        row = [];
        // Go past the \n.
        i++;
        lastDelimiter = i;
      } else if (current === '\n') {
        // End of row detected, gather value and start new row.
        gatherValue();
        rows.push(row);
        row = [];
      } else if (i === string.length - 1) {
        // End of file reached, last line does not have \n.
        i++;
        gatherValue();
        rows.push(row);
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
      // Two adjacent double quotes, skip over.
      // TODO: Need to remove the additional double quote from the end result.
      i += 2;
    } else {
      // Closing double quote detected.
      inQuotes = false;
      if (i < string.length - 1) {
        i++;
      } else {
        // End of file reached, last line does not have \n.
        i++;
        gatherValue();
        rows.push(row);
      }
    }
  }

  return rows;
}

interface AnyObject {
  [key: string]: any;
}

export function parseString(string: string): Array<AnyObject> {
  const result: Array<AnyObject> = [];

  const rows = csvToArray(string);
  if (rows.length === 0) {
    return result;
  }

  const keys = rows[0];
  for (let i = 1; i < rows.length; i++) {
    const obj: AnyObject = {};
    for (let j = 0; j < keys.length; j++) {
      obj[keys[j]] = rows[i][j];
    }
    result.push(obj);
  }

  return result;
}
