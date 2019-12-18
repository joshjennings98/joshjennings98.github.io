<!-- title: HCR AI Subsystem -->
<p>
    In this group project, a study is to be conducted into the effects on user experience from varying the amount of interaction a robot has with a user. This is done through a custom robot with features that allow it to engage with the user with different types of actions. The robot will receive user feedback through an integrated rating scale; this will allow for the evaluation and analysis of these interactions. In this report, the design of the robot is explained in detail. Robot features include motion, facial detection and voice recognition, with additional subsystems for the artificial intelligence (AI), visual display and a status monitor.
</p>

<p>
    The AI subsystem links together all the other subsystems and controls what is able to occur at a given time. It receives information from other subsystems and based on the current state of the entire robot it passes information to relevant subsystems and changes the state the robot is in. If certain actions aren't allowed in the a particular state, this system stops them from happening through the use of flags that lock parts of the system.
</p>

<p>
    It uses a custom state machine written purely in python with no libraries. This design choice meant that the AI subsystem won't have any conflicts with the other parts of the robot. Furthermore, the use of a custom state machine makes it easy to add new states and flags to the subsystem. For example, a new behaviour can be introduced with the addition of a single state object and defining the transition conditions into and out of this state. This results in a highly modular and expandable AI system.
</p>

<p>
    The major parts of the AI subsystem are: the main loop, the state machine, and the definitions file:
    <ul>
        <li> The main loop consists of a loop that runs twice every second. It first checks all the messages that are relevant to the AI subsystem, and assigns them to the internal state of the AI. Then using it's newly updated internal state, it works out whether it needs to set flags or change the state of the robot. Finally, any messages that need to be sent to other subsystems, such as the screen or movement subsystems, are sent. </li>
        <li> The state machine contains all of the possible state objects. Each state object has a run function and an event function. The run function is used for updating flags that must be set for a specific state. This allows for the AI to allow or disallow specific things depending on the state. The event function contains a switch statement that points to different states if different flags, those set in the AI main loop, are specific values. If non of the requirements to move to another state are met, then the state object will return itself. </li>
        <li> The definitions file contains the classes that are required to define new states, state machines, and flag objects. </li>
    </ul>
</p>

