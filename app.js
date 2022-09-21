const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// GET all list os states
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT
            *
        FROM
            state
        ORDER BY
            state_id;`;
  const dbResponse = await db.all(getStatesQuery);

  const result = dbResponse.map((element) => ({
    stateId: element.state_id,
    stateName: element.state_name,
    population: element.population,
  }));

  response.send(result);
});

// GET state details for given id
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT
            *
        FROM
            state
        WHERE
            state_id = ${stateId};`;
  const dbResponse = await db.get(getStateQuery);
  const result = {
    stateId: dbResponse.state_id,
    stateName: dbResponse.state_name,
    population: dbResponse.population,
  };

  response.send(result);
});

// POST a district in district table
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtId,
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
        INSERT INTO
            district (
            district_name,
            state_id,
            cases,
            cured,
            active,
            deaths)
        VALUES (
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths});`;
  //console.log(addDistrictQuery);
  const dbResponse = await db.run(addDistrictQuery);
  //console.log(dbResponse.lastID);
  response.send("District Successfully Added");
});

// GET district details for given id
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT
            *
        FROM
            district
        WHERE
            district_id = ${districtId};`;
  const dbResponse = await db.get(getDistrictQuery);
  const result = {
    districtId: dbResponse.district_id,
    districtName: dbResponse.district_name,
    stateId: dbResponse.state_id,
    cases: dbResponse.cases,
    cured: dbResponse.cured,
    active: dbResponse.active,
    deaths: dbResponse.deaths,
  };

  response.send(result);
});

// DELETE distrct by id
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuerry = `
        DELETE FROM 
            district
        WHERE
            district_id = ${districtId};`;

  await db.run(deleteDistrictQuerry);
  response.send("District Removed");
});

// UPDATE district details by id
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictDetailsQuery = `
        UPDATE
            district
        SET
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths};`;
  const dbResponse = await db.run(updateDistrictDetailsQuery);
  response.send("District Details Updated");
});

// GET statics of cases of state
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  //console.log(stateId);
  const getStateStaticsQuery = `
        SELECT
            SUM(district.cases) AS totalCases,
            SUM(district.cured) AS totalCured,
            SUM(district.active) AS totalActive,
            SUM(district.deaths) AS totalDeaths
        FROM district
        WHERE
            district.state_id = ${stateId};`;
  //console.log(getStateStaticsQuery);
  const dbResponse = await db.get(getStateStaticsQuery);
  //console.log(dbResponse);
  response.send(dbResponse);
});

// GET state name by district id
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
        SELECT state.state_name AS stateName
        FROM district INNER JOIN state ON 
            district.state_id = state.state_id
        WHERE district_id = ${districtId};`;
  const dbResponse = await db.get(getStateNameQuery);
  response.send(dbResponse);
});
module.exports = app;
