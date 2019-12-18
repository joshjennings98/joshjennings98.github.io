<!-- title: Visual2 Extension: UAL Assemebly to GNU Assembler -->

<p>
    This work was an add on to the VisUAL2 Arm Assembly emulator. View the github repo <a href="https://github.com/tomcl/visual2.github.io">here</a>.
</p>

<h2>How to use</h2>
<p>
    Add any header attributes you want to the GNU attributes field in the settings menu. (This can be any string and isn't checked or parsed since there are lots of different GNU attributes so what is put here is left up the discretion of the user.)
    Put some VisUAL2 ARM Assembly code into visual and then select "Export as GNU" in the file menu or press "Ctrl + e" to export the code to a .S file.
</p>

<h2>My Work</h2>

<p>
    My module has the goal of taking the code in the current tab and converting it to ARM GNU As syntax. To implement this I did the following:
    <ul>
        <li>Added a tpye ExportParseError which gives errors when there are arithemtic operators, no code to parse, and when the parser fails to parse the code.</li>
        <li>Added a record called ExportStateData that contains the preprocessed code, the postprocessed code, and a copy of the header attributes.</li>
        <li>Created four helper functions which do what they sound like they do (Note that these differ from the implementations in EEExtensions):
        <ul>
            <li>charListToString (charList : char list) : string</li>
            <li>splitIntoLinesList (data : string) : string list</li>
            <li>splitIntoWordsList (line : string) : string list</li>
            <li>rebuildLine (wordList : string list) : string</li>
        </ul></li>
    <li>Created a function modifyDirectives (line : string) : string that takes a line and (if they occur) replaces directives, pseudodirectives, and data directives with their corresponding GNU As equivalents.</li>
    <li>Created a function modifyMisc (line : string) : string that takes a line and (if they occur) switches the label and the EQU instruction since this is the required syntax in GNU As.
    <li>Created a function formatLabel (line : string) : string that adds a line and adds a colon to the end of any labels that occur on the line.</li>
    <li>Created a function formatComments (line : string) : string that takes a line and replaces the first occurrence of a semicolon with a double forwards slash.</li>
    <ul>    
        <li>This function is specifically designed to only change the first occurence of a semicolon just in case the comment has need of semicolons as semicolons.</li>
        <li>There is an alternative implementation of this function called formatComments1 that is commented out. This is used for oracle testing.</li>
    </ul>
    <li>Created a function called formatNumericValues (line : string) : string that converts any binary numbers or unsigned integers in a line into decimal integers to satisfy the requirements of GNU As syntax.</li>
    <ul>    
        <li>There is a commented out version of this code called formatNumericLiterals that uses as different implementation to convert only numeric literals with a # at the front to decimal. Whilst this is superceded by formatNumericValues, I left it here as I spent ages making it and although it's not as good as the method I used in the end, I still like it.</li>
    </ul>
    <li>Created a function checkForOperators (data : string list) : Result<string, ExportParseError> that takes the entirety of the data as a string list and (if they exist) finds every line containing a +, a -, or a * and gives an arithmetic operator error containing a list of distinct line numbers were the operators occur.</li>
    <ul>    
        <li>I don't think this function is actually neccesary since I think that GNU As can use operators in expressions line VisUAL2 ARM Assembly however, I didn't have many types or errors so I left this in to showcase their use.</li>
        <li>THIS MESSES UP IF THERE ARE ARITHMETIC OPERATORS IN COMMENTS SINCE I FORGOT TO ACCOUNT FOR THAT, OOPS!!!</li>
    </ul>
    <li>Created a function reformatCode (tabID : int) : Result<ExportStateData, ExportParseError> that takes a tabID and attempts the parse the code in that tab before putting the preprocessed and postprocessed code into the ExportStateData record along with accessing the vSettings and adding the value in GNUAssemblerHeader to the GNUAttributes field.</li>
    <ul>    
        <li>If there is no code this function outputs an error.</li>
        <li>If the code doesn't parse this code outputs and error.</li>
        <li>I use the existing function tryParseAndIndent from Integration.fs to pre parse and indent the code to be used by my functions. This reduced the amount of work I needed to do and guaranteed that any code going into my functions was error free. This is why none of my functions use error types. All the code going in is valid and my functions cover all the cases (I think...).</li>
        <li>This function could be replaced by modifying 'Files.fs' but I wanted to minimise number of modules I was editing and also it requires 'formatFileCode' which exists in that module. This would require my code to be before this Files.fs but after 'Integration.fs' which would mess with the module order and require adding extra code so I just put it here instead.</li>
    </ul>
    <li>Created a function exportAsGNU which is the same as saveFileAs from Files.fs except with modified file extension information as well as calling reformatCode instead of writing directly to the file. Another modification made to this function is the use of a showVexAlert, if the code doesn't parse, doesn't exist, or contains arithmetic operators, a popup will appear with the relevant error message and the code won't be exported.</li>
</p>

<h2>MenuBar.fs</h2>
<p>
    Added open ExportGNU.
    Added a new makeItem and menuSeparator to fileMenu() creating an "Export as GNU" button in the files menu which calls my function exportAsGNU from ExportGNU.fs. This button has the shortcut CmdOrCtrl+E.
</p>

<h2>Refs.fs</h2>
<p>
    Added a GNUAsssemblerHeader : string field to the vSettings type.
    Added the above field to let mutable vSettings to give a default value of an empty string.
</p>

<h2>Settings.fs</h2>
<p>
    I added let gnuAssemblerHeader = "gnu-assembler-header".
    Added a function called makeInputString to create a string based HTMLInputElement.
    In settingsMenu I added a section called "Export Options" with a new form for inputting a string that contains the header attribute stuff that will be palced at the top of the exported file.
    In getFormSettings I added the GNUAssemblerHeader field.
</p>