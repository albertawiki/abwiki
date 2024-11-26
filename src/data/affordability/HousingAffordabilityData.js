// From RBC affordability reports.
// Dates represent "end of quarter"
export const housingAffordability = {
    calgary: {
        "2019": {
            "Q4": 38.5
        },
        "2020": {
            "Q1": 38.1,
            "Q2": 35.9,
            "Q3": 36.7,
            "Q4": 37.2,
        },
        "2021": {
            "Q1": 37.0,
            "Q2": 31.7,
            "Q3": 32.8,
            "Q4": 32.9,
        },
        "2022": {
            "Q1": 35.3,
            "Q2": 38.8,
            "Q3": 41.6,
            "Q4": 43.2
        },
        "2023": {
            "Q1": 43.0,
            "Q2": 44.0,
            "Q3": 47.6,
            "Q4": 48.3
        },
        "2024": {
            "Q1": 43.5,
            "Q2": 42.5,
        },
    },
    edmonton: {
        "2019": {
            "Q4": 31.6
        },
        "2020": {
            "Q1": 31.3,
            "Q2": 29.3,
            "Q3": 30.1,
            "Q4": 30.4,
        },
        "2021": {
            "Q1": 31.9,
            "Q2": 27.4,
            "Q3": 28.5,
            "Q4": 25.8,
        },
        "2022": {
            "Q1": 27.1,
            "Q2": 29.3,
            "Q3": 31.2,
            "Q4": 32.3
        },
        "2023": {
            "Q1": 34.2,
            "Q2": 34.2,
            "Q3": 36.7,
            "Q4": 36.8
        },
        "2024": {
            "Q1": 35.5,
            "Q2": 33.7,
        },
    }
}

// Function to transform housing affordability data into a format Recharts can use with Date objects
export const formatHousingData = () => {
  const cities = Object.keys(housingAffordability);
  const formattedData = [];

  const quarterEndDates = {
    Q1: "-03-31",
    Q2: "-06-30",
    Q3: "-09-30",
    Q4: "-12-31"
  };

  const quarterSuffix = {
    Q1: "-Q1",
    Q2: "-Q2",
    Q3: "-Q3",
    Q4: "-Q4"
  };

  cities.forEach((city) => {
    Object.entries(housingAffordability[city]).forEach(([year, quarters]) => {
      Object.entries(quarters).forEach(([quarter, value]) => {
        //const dateStr = `${year}${quarterEndDates[quarter]}`;
        //const date = new Date(dateStr);  // Convert string to Date object

        const dateStr = `${year}${quarterSuffix[quarter]}`;
        const date = dateStr;

        formattedData.push({
          date,  // Use Date object here
          city,
          value
        });
      });
    });
  });


  // Sort the data by date to ensure proper ordering
  return formattedData.sort((a, b) => a.date.localeCompare(b.date));
};