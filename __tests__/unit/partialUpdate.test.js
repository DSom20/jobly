const sqlForPartialUpdate = require("../../helpers/partialUpdate");

// RENAME VARIABLES, ETC.
describe("partialUpdate()", () => {
  it("should generate a proper partial update query with just 1 field",
    function () {
      let items = { "col_1": "updateVal1", "col_2": "updateVal2", "col_3": "updateVal3"};
      const result = sqlForPartialUpdate("table_name", items, "username", "david");

      expect(result).toEqual(
        {
          query: `UPDATE table_name SET col_1=$1, col_2=$2, col_3=$3 WHERE username=$4 RETURNING *`,
          values: ["updateVal1", "updateVal2", "updateVal3", "david"]
        }
      );
    });
});
