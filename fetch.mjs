import * as fs from 'node:fs/promises';

const getCities = async () => {
	// https://github.com/TibiaData/tibiadata-api-go/issues/198
	const response = await fetch('https://assets.tibiadata.com/data.min.json');
	const data = await response.json();
	return data.towns;
};

const getBuildingsForCity = async (city) => {
	const response = await fetch(`https://api.tibiadata.com/v3/houses/Antica/${encodeURIComponent(city)}`);
	const data = await response.json();
	console.log(`Processing houses & guildhalls in ${city}…`);
	return data;
};

const cities = await getCities();
// Kick off all requests in parallel.
const buildingsPerCity = cities.map((city) => getBuildingsForCity(city));

const HOUSES = [];
const GUILDHALLS = [];
for await (const stats of buildingsPerCity) {
	const {guildhall_list, house_list, town} = stats.houses;
	if (guildhall_list) {
		for (const guildhall of guildhall_list) {
			GUILDHALLS.push({
				city: town,
				name: guildhall.name,
				id: String(guildhall.house_id),
				size: guildhall.size,
				rent: guildhall.rent,
			});
		}
	}
	if (house_list) {
		for (const house of house_list) {
			HOUSES.push({
				city: town,
				name: house.name,
				id: String(house.house_id),
				size: house.size,
				rent: house.rent,
			});
		}
	}
}

const comparator = (a, b) => {
	return a.id - b.id;
};
HOUSES.sort(comparator);
GUILDHALLS.sort(comparator);

const writeJsonFile = async (filePath, data) => {
	const json = JSON.stringify(data, null, '\t');
	await fs.writeFile(filePath, `${json}\n`);
};

await writeJsonFile(`data/houses.json`, HOUSES);
await writeJsonFile(`data/guildhalls.json`, GUILDHALLS);
