# Tower Unite Laser Expression Simulator

This is a simulator for [Tower Unite's Laser Expression Language](https://steamcommunity.com/sharedfiles/filedetails/?id=1136940994).

The simulator supports a subset of Tower Unite's behaviors, meaning that any programs written here should work in Tower Unite but not every program written in Tower Unite will work on here.

The reason for this is that Tower Unite's expression language has a lot of odd and undefined behaviors, that people likely should not be relying on anyways.

If you'd like to learn more about Tower Unite's Laser Expression Language you can read the [official guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1136940994).

## quirks, oddities, and undefined behavior
Tower Unite's expression language has a lot of odd behavior that may not be immediately obvious.

There's more behavior that are not listed.
if there's information that's wrong or not listed, please feel free to let me know on the forum post or by [creating a github issue](https://github.com/brecert/tower-unite-laser-expression-simulator/issues/new).

### Unsupported Behavior
- any expression can be assigned to without an error, but it seems only identifiers alone will actually do anything.
    ```
    1 = x;
    ```
- right parenthesis can be inserted almost anywhere without error, the language will skip them
- many of the operators seem to be parsed like infix operators `-(2 * 3)` is the same as `(2 * 3)-` 
- operators don't need the left and right to be valid, `x' = /1;` is a valid statement, and so is `y' = 10*;`
- there can be multiple expressions in a single expression. I'm unsure what the behavior is for this.

### Supported Behavior
- operator precedence may not always be what you expect. for example, `!` will capture everything to the right of it, rather than the nearest identifier or expression.
operator precedence seems to be based on the the order they appear in [official guide's](https://steamcommunity.com/sharedfiles/filedetails/?id=1136940994) operator table. 