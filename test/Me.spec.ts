import { assert } from "chai";
import "mocha";
import { soundcloud } from "./login";

describe.skip("Me", function () {
  it("should get me", async function () {
    const response = await soundcloud.me.get();
    assert(Object.prototype.hasOwnProperty.call(response, "username"));
  });
});
