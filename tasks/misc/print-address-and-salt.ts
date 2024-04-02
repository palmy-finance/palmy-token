import { task } from 'hardhat/config';
import { getDb } from '../../helpers/misc-utils';

task('print-address-and-salt', 'print-address-and-salt').setAction(async ({}, localBRE) => {
  const db = getDb();
  const dbJson = db.toJSON();
  Object.keys(dbJson).forEach((key) => {
    if (dbJson[key].oasys === undefined) return;
    console.log(`${key},${dbJson[key].oasys?.salt},${dbJson[key].oasys?.address}`);
  });
});
