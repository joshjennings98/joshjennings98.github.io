<!-- title: F# Brainfuck to C Transpiler -->

<p>
    Transpile Brainfuck to C. Implemented in F#.
</p>

<p>
This code is purposefully written quite verbosely since brainfuck compilers have been made that are only 100 - 200 bytes so there is no point in making it super small.
<br>
To remove optimisations, set the `optimise` variable to false.
<br>
To change the array size, change the `SIZE` variable to the desired value.
</p>

<h2>Types.fs</h2>
<p>
    The types defined are the `Token` type and the `Instruction` types:
    <ul>
        <li>The `Token` type is a tuple of an `Instruction` and an integer that represents how many times that instruction is called at once.</li>
        <li>The `Instruction` type contains representations for: pointer increment; pointer decrement; cell increment; cell decrement; loop start; loop end; input char; output char; addition; subtraction; and set. The final three are pseudo instructions that allow a simplified output when transpiling to C.</li>
    </ul>
</p>

<h2>Tokeniser.fs</h2>

<p>
    This module generates a list of basic tokens from the input string. Brainfuck documentation says that all invalid characters are ignored and so part of the tokenisers job is to filter out all invalid characters.
</p>

<h2>Optimiser.fs</h2>

<p>
    This module applies several optimisations to the tokenised list:
    <ul>
        <li>Fusing cell increments and cell decrements. For example, `++++` can be transformed into `p[0] += 4` and `+++--` can be converted into `p[0] += 1`.</li>
        <li>Fusing pointer increments and pointer decrements. For example, `>>` can be transformed into `p += 2` and `><<<` can be converted into `p-= 2`.</li>
        <li>Fusing movements into additions and subtractions. Some brainfuck strings can be interpretted as addition and subtraction since the overall pointer movement is zero. For example `>>---<<` results in the pointer ending up where it started, therefore it can become `p[2] -= 3`. The same can be done with addition.</li>
        <li>Postponing movements. If a string of brainfuck consists of only increments, decrements, inputs, and outputs, then the virtual movement of the pointer can be kept track of then performed in one shot at the end. For example `>+>->` becomes `p[1]+=1; p[2]-=1; p+=3;`.</li>
        <li>Setting values to zero. Due to number wrapping, `[-]` or any loop that only contains arithmetic will eventually go to zero.</li>
    </ul>

    Sevaral more optimisations could/should be implemented:
    <ul>
        <li>Simple loops. If the loop body has no subloops and no inputs or outputs and all the movements add up to 0 and all the increments/decrements at `p[0]` add up to −1, then loop body is being run `p[0]` times. So for all the increments/decrements outside of `p[0]`, some multiple of `p[0]` is being added to that location. For example, `[->+>---<<]` becomes `p[1]+=p[0]; p[2]-=p[0]*3; p[0]=0;`.</li>
        <li>Complex loops. If a location other than the loop counter is used as the source for multiply-add and this location is cleared to 0 within the loop, then the loop can be turned into an if statement.</li>
    </ul>
    </p>

<h2>Compiler.fs</h2>

<p>
    This module turns the token list into a list of C instructions and then outputs it as a string. It keeps track of loops using a mutable variable `indentation` which is used to generate tabs.
</p>

<h2>BrainfuckTranspiler.fs</h2>

<p>
    This module is the entrance to the program. This module interprets any input arguments. It then runs the tokeniser, if desired the optimiser,  and compiler. If there is an error then it will be returned here. 
</p>
<h2>Notes</h2>
<p>
    Ideas for optimisations came from <a href="https://www.nayuki.io/page/optimizing-brainfuck-compiler">https://www.nayuki.io/page/optimizing-brainfuck-compiler</a>

    <br>

    <b>To Do:</b>
    <ul>
        <li>Account for wrapping of bytes.</li>
        <li>Add compile arguments for brainfuck such as array size.</li>
        <li>Add file input and output rather than just terminal input.</li>
        <li>Add more optimisations.</li>
    </ul>
</p>