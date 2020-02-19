const sqlForPartialUpdate = require("../../helpers/partialUpdate")

// RENAME VARIABLES, ETC.
describe("partialUpdate()", () => {
  it("should generate a proper partial update query with just 1 field",
    function () {
      let items = { "key1": "item1", "key2": "item2", "_key3": "item3" };
      const result = sqlForPartialUpdate("table1", items, "username", "david");

      expect(result).toEqual(
        {
          query: `UPDATE table1 SET key1=$1, key2=$2 WHERE username=$3 RETURNING *`,
          values: ["item1", "item2", "david"]
        }
      );

    });
});
