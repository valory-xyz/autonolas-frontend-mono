/**
 * - unitIds and unitTypes are arrays of same length
 * - unitIds has to be unique
 */
export const sortUnitIdsAndTypes = (unitIds, unitTypes) => {
  const sortedUnitIds = [...unitIds].sort((a, b) => a - b);
  const sortedUnitTypes = sortedUnitIds.map((e) => unitTypes[unitIds.indexOf(e)]);
  return [sortedUnitIds, sortedUnitTypes];
};
