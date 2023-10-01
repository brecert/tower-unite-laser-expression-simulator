# Tower Unite Laser Expression Simulator

This is a simulator for [Tower Unite's Laser Expression Language](https://steamcommunity.com/sharedfiles/filedetails/?id=1136940994).

The simulator supports a subset of Tower Unite's behaviors, meaning that any programs written here should work in Tower Unite but not every program written in Tower Unite will work on here.

The reason for this is that Tower Unite's expression language has a lot of odd and undefined behaviors, that people likely should not be relying on anyways.

If you'd like to learn more about Tower Unite's Laser Expression Language you can read the [official guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1136940994).


## quirks, oddities, and undefined behavior
Tower Unite's expression language has a lot of odd behavior that may not be immediately obvious or seem like bugs.

I've chosen to only support a subset of behaviors that seem to be intended and are easy to support accurately.

There's more behavior that are not listed.
if there's information that's wrong or not listed, please feel free to let me know on the forum post or by [creating a github issue](https://github.com/brecert/tower-unite-laser-expression-simulator/issues/new).


### Unsupported Behavior

- in tower any expression can be assigned to without an error, but it seems only identifiers alone will actually do anything.
    ```
    1 = x;
    ```

    I've chosen not to support this behavior since it seems like it would lead to bugs.

- in tower right parenthesis can be inserted almost anywhere without error and the language will skip them. 

    I've chosen not to support this as that seems unintended and can lead to visual parsing issues which can lead to bugs.

- in tower many of the operators seem to be parsed like infix operators `-(2 * 3)` is the same as `(2 * 3)-`. 

    I've chosen not to support this because 

- in tower operators don't need the left and right to be valid, `x' = /1;` is a valid statement, and so is `y' = 10*;`

    I've chosen not to support this because I'm not quite sure what the intended behavior is, as there's nothing in the official guide about it and it seems like it could lead to bugs.

- in tower there can be multiple expressions in a single expression.
    
    I've chosen not to support this because I'm unsure what the behavior is, it seems like it can lead to bugs, and it could make parsing more ambiguious.

- in tower, output values from the previous laser (point) are kept around for the next one, making expressions like this create a rainbow.
    ```
    x' = x;
    y' = y;

    h = h + 1;
    s = 1;
    v = 1;
    ```

    While being a reasonable behavior to support, this is unsupported for a number of reasons.

    The behavior of it is hard to replicate, I'm not sure how fast cycles are or if they're framerate dependent, and unintentionally using an output variable before assigning to it could create odd issues with the script that may not be easy to figure out normally.
    
    I've also started compiling expressions to GLSL for rendering performance, but I'm new to it and I'm not sure how to read values from a previous vertex shader in the same frame. My assumption is that you can't because of the nature of how a GPU works but if I'm wrong and you can offer advice it'd be much appreciated.

    For these reasons an output value must have a value assigned to it before being used or else it'll raise an error.


### Supported Behavior

- operator precedence may not always be what you expect. for example, `!` will capture everything to the right of it, rather than the nearest identifier or expression.

    operator precedence seems to be based on the the order they appear in [official guide's](https://steamcommunity.com/sharedfiles/filedetails/?id=1136940994) operator table. 

    This is supported because if it wasn't then expressions written for the simulator wouldn't be accurate in tower itself.