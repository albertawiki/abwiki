// https://www.oecd.org/en/publications/pisa-2015-results-volume-i_9789264266490-en.html
// https://www.oecd.org/en/publications/pisa-2018-results-volume-i_5f07c754-en.html 
// https://www.oecd.org/en/publications/pisa-2022-results-volume-i_53f23881-en.html

  export const pisaData = [
    { year: '2015', math: 511, reading: 533, science: 541  },
    { year: '2018', math: 511, reading: 532, science: 534  },
    { year: '2022', math: 504, reading: 525, science: 534  },
  ];

  export const pisaDataBottomQuartile = [
    { year: '2015', math: 453, reading: 474, science: 479 },
    { year: '2018', math: 450, reading: 464, science: 468 },
    { year: '2022', math: 432, reading: 449, science: 462 },
  ];

  export const pisaDataTopQuartile = [
    { year: '2015', math: 571, reading: 597, science: 605 },
    { year: '2018', math: 575, reading: 604, science: 602 },
    { year: '2022', math: 571, reading: 605, science: 608 },
  ];

  // Combine data for gap calculation
export const combinedData = pisaData.map((d, i) => {
  const bottom = pisaDataBottomQuartile[i];
  const top = pisaDataTopQuartile[i];
  return {
    year: d.year,
    math: d.math,
    reading: d.reading,
    science: d.science,
    gapMath: top.math - bottom.math,
    gapReading: top.reading - bottom.reading,
    gapScience: top.science - bottom.science,
  };
});