import { sortUnitIdsAndTypes } from './index';

describe('sortUnitIdsAndTypes', () => {
  it('should sort unitIds and the same index sort should be applied to unitTypes', () => {
    expect.hasAssertions();

    const unitIds1 = ['95', '20', '5', '45'];
    const unitTypes1 = ['1', '0', '1', '0'];
    const sortedUnitIds1 = ['5', '20', '45', '95'];
    const sortedUnitTypes1 = ['1', '0', '0', '1'];

    expect(sortUnitIdsAndTypes(unitIds1, unitTypes1)).toStrictEqual(
      [sortedUnitIds1, sortedUnitTypes1],
    );

    const unitIds2 = ['1', '75', '25', '40'];
    const unitTypes2 = ['0.5', '0.065', '1', '0.25'];
    const sortedUnitIds2 = ['1', '25', '40', '75'];
    const sortedUnitTypes2 = ['0.5', '1', '0.25', '0.065'];

    expect(sortUnitIdsAndTypes(unitIds2, unitTypes2)).toStrictEqual(
      [sortedUnitIds2, sortedUnitTypes2],
    );
  });
});
