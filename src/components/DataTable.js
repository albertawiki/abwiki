import React from 'react';

/**
 * The numbers behind a figure.
 *
 * Every chart on the site can be expanded into this table. It is not a
 * nicety: some of our series colours sit below 3:1 contrast on a white card,
 * and a reader who cannot separate two lines needs the values. It also means
 * anyone can check a chart against the cited source without reading our code.
 */
const DataTable = ({ columns, rows, caption }) => (
  <div className="data-table-wrap">
    <table className="data-table">
      {caption && <caption>{caption}</caption>}
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} scope="col">{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((c, j) => {
              const value = row[c.key];
              const text = value === null || value === undefined ? '—' : value;
              return j === 0
                ? <th key={c.key} scope="row">{text}</th>
                : <td key={c.key}>{text}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default DataTable;
