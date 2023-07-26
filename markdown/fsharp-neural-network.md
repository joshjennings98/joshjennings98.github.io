# F# Neural Network

A small F# library that allows for the creation of scalable fully-connected neural networks. It was developed for and built entirely using F#.

## Usage

### Defining a network

Networks can be specified using the following format. Any number of layers are supported. Provided they align, the dimensions can be as large as desired.

```fsharp
let network = [
    {inputDims = 3; outputDims = 5; activation = Sigmoid};
    {inputDims = 5; outputDims = 6; activation = Sigmoid};
    {inputDims = 6; outputDims = 2; activation = Sigmoid};
]
```

You can choose from multiple different activation functions including:

* Relu
* Sigmoid
* Tanh
* Softmax
* Leaky Relu
* Elu
* Selu
* Softsign
* Softplus
* Exponential
* Hard Sigmoid
* Linear

### Training a network

Input data is provided in the form of a list of inputs, and a list of labels corresponding to each input.

```fsharp
(* Inputs *)
let data = [
    [0.5; 1.0; 0.2];
    [0.1; 0.7; 1.0];
    [1.0; 0.1; 0.1];
    [0.0; 0.34; 0.8];
    [0.6; 0.1; 0.3]
]

(* Labels *)
let labels = [
    [1.0; 1.0];
    [0.0; 1.0];
    [0.0; 0.0];
    [1.0; 0.0];
    [0.0; 1.0];
]
```

To train and run the network, see the code snippets below:

```fsharp
(* trainNetwork architecture labels data learning-rate loss iterations *)
let model = trainNetwork network labels data 0.05 MSE 100000
```

Currently, the following loss functions are avaliable:

* Mean Square Error
* Cross Entropy
* Mean Absolute Error

### Running a trained network

A single run of the network can be specified as follows:

```fsharp
(* runNetwork model input architecture *)
runNetwork model [0.1; 0.8; 0.4] network (* [0.90643753; 0.99834754] *)
```

We can test multiple inputs by using a loop:

```fsharp
for idx in List.init (List.length data) id do
    printfn "Input: %A" data.[idx]
    printfn "Output: %A" (runNetwork model data.[idx] network)
```

This will print the following:

```
Input: [0.5; 1.0; 0.2]
Output: [0.9748251802; 0.9991071572]

Input: [0.1; 0.7; 1.0]
Output: [0.04458155893; 0.9556900964]

Input: [1.0; 0.1; 0.1]
Output: [1.150921027e-05; 0.03353754142]

Input: [0.0; 0.34; 0.8]
Output: [0.9681691113; 0.03517992806]

Input: [0.6; 0.1; 0.3]
Output: [0.003145187104; 0.9791424116]
```

These match up with the labels specified earlier.

## How it works

### Forward Propagation

A single forward propagation though a layer just involves multiplying the inputs to the layer with the layer weights (their dot product). After this, they are summed and the bias added before having the activation layer for that function applied.

```fsharp
let forwardSingleLayer (bias : float) (weights : float list list) (inputs : float list) (activation : Activation) : float list =
    weights
    |> List.map (fun list -> List.map2 ( * ) list inputs)
    |> List.map (fun list -> List.sum list + bias)
    |> activateLayer activation
```

The activateLayer function takes an activation and maps the corresponding activation function across the list before returning it. A small part of this function can be see below:

```fsharp
let activateLayer (activation : Activation) (input : float list) : float list =
    match activation with
    | Sigmoid ->
        List.map (fun x -> 1.0 / (1.0 + exp(-x))) input
    | Relu ->
        List.map (fun x -> max x 0.0) input
```

The full forward propagation is slightly more complex. It first creates an empty list the size of the network. It folds though the epty list using the accumulator to store the intermediate activated and unactivated output of all layers. It then adds an extra layer containing only 1.0s to the end of the forward propagated output. This makes it easier when doing back propagation.

```fsharp
let forwardFull (parameters : Parameters) (inputs : float list) (layers : Layer list) : float list list =
    List.init layers.Length id
    |> List.fold (fun (acc : float list list) index ->
        let biases, weights, activation =
            parameters.biases.[index], parameters.weights.[index], layers.[index].activation
        [forwardSingleLayer biases weights acc.[0] activation] @ acc)
            [inputs]
    |> List.append [List.init (List.last layers).outputDims float]
```

### Calculating Error

To calculate the error in the output, the output of forward propagation and the target output are passed to a function that calculated the loss.

```fsharp
let getOverallError (targetOutputs : float list) (actualOutputs : float list) (loss : Loss) : float =
    actualOutputs
    |> List.map2 (lossFunction loss targetOutputs.Length) targetOutputs
    |> List.sum
```

Similarly to the activation functions, the loss functions are supplied using pattern matching In this case however, they return a function that can be applied wherever the particular value required instead of taking an returning a list. Part of lossFunction can be seen below:

```fsharp
let lossFunction (loss : Loss) (n : int) : float -> float -> float =
    match loss with
    | MSE ->
        fun actual target ->
            (1.0 / (n |> float)) * (actual - target) ** 2.0
    | MAE ->
        fun actual target ->
            (1.0 / (n |> float)) * (abs (actual - target))
```

### Back Propagation

Back propagation is more complex than the forward version. We first calculate the intermidate output sums. For the output layer, the only thing that needs to be done is for the derivatve of the loss function to applied to the outputs. For the hidden layers, the individual deltas for each node in the previous layer are found. Afterwards, the layer weights are taken and multiplied by their corresponding deltas. The values coming into each node are then summed.

The new weights are then calculated. This is simpler. The derivative of the activation function is found and then multiplied by the corresponding output delta sum. This is then multipliued by the output od of the previous layer resulting in a value corresponding to `learningRate * delta * outPrev`. This value is then subtracted from the corresponding weight as back propagation is defined.

The new weights and intermediate output deltas are then returned.

```fsharp
let backPropSingleLayer (targetOutputs : float list) (loss : Loss) (learningRate : float) (backPropPart : float list) (layerIndex : int) (forwardPropParts : float list list) (allWeights : float list list list) (layers : Layer list) : float list list * float list =

    let intermediateOutputDeltaSum =
        if layerIndex = 0
        then (* Output layer *)
            forwardPropParts.[layerIndex + 1]
            |> List.map2 (dLossFunction loss targetOutputs.Length) backPropPart
        else (* Hidden layers *)
            List.init forwardPropParts.[layerIndex + 1].Length (fun _ ->
                forwardPropParts.[layerIndex]
                |> dActivateLayer layers.[layerIndex - 1].activation
                |> List.map2 ( * ) backPropPart)
            |> List.mapi (fun index1 deltas ->
                allWeights.[layerIndex]
                |> List.mapi (fun index2 weights -> weights.[index1] * deltas.[index2]))
            |> List.map List.sum

    let newWeights =
        forwardPropParts.[layerIndex + 1]
        |> dActivateLayer layers.[layerIndex].activation
        |> List.map2 ( * ) intermediateOutputDeltaSum
        |> List.map (fun delta ->
            forwardPropParts.[layerIndex + 2]
            |> List.map (fun out -> learningRate * delta * out))
        |> List.map2 (List.map2 (-)) allWeights.[layerIndex + 1]

    newWeights, intermediateOutputDeltaSum
```

The full back propagation invloved first reversing the parameters. This makes it easier to work on as we start from the final layer and work towards the input.

The next step is to fold through the network from the outer layer and calculate all the new values for each weight using `backPropSingleLayer`. This is then added to a list containing each layer and acts as the accumulator.

```fsharp
let backPropFull (layers : Layer list) (parameters : Parameters) (targetOutputs : float list list) (learningRate : float) (loss : Loss) (forwardPropParts : float list list) : (float list list * float list) list =

    let weights =
        List.rev parameters.weights

    List.init (layers.Length) id
    |> List.fold (fun acc index ->
        let targetOutputs =
            acc.[0]
            |> fst
            |> List.map List.sum

        let backPropPart = snd acc.[0]

        let backPropOutput =
            backPropSingleLayer targetOutputs loss learningRate backPropPart index forwardPropParts weights layers

        [backPropOutput] @ acc)
            [targetOutputs, (List.concat targetOutputs)]
```

The derivatives of the activations and loss functions are very similar to the normal counter parts. Parts of the `dActivateLayer` and `dLossFunction` can be seen below:

```fsharp
let dActivateLayer (activation : Activation) (input : float list) : float list =
    match activation with
    | Sigmoid ->
        List.map (fun x -> x * (1.0 - x)) input
    | Relu ->
        List.map (fun x -> if x > 0.0 then 1.0 else 0.0) input

let dLossFunction (loss : Loss) (n : int) : float -> float -> float =
    match loss with
    | MSE ->
    fun actual target ->
    (2.0 / (n |> float)) * (actual - target) * -1.0
    | MAE ->
    fun target actual ->
        if actual > target then 1.0 else -1.0
```

### Training

Training the network is a fairly simple recursive function that continually picks a random sample of the data set and carries out forwards and backwards propagation using the sample for any number of iterations. A simplified version of the function (initialisation and printing etc. removed) can be seen below:

```fsharp
let rec train (parameters : Parameters) (model : Layer list) (maxIterations : int) (iterations : int) =
    let idx = System.Random().Next(0, List.length targetOutputs)

    let fullSingle =
        forwardFull parameters inputs.[idx] architecture
        |> backPropFull architecture parameters targets.[idx] learningRate loss
        |> weightUpdate parameters

    train fullSingle model maxIterations (iterations + 1)

(* This is called like below *)
train initial architecture iterations 0
```

## Bugs

Be careful with the chosen parameters. The networks can die easily if the chosen parameters cause weigths to overflow and become NaN, alternatively the network won’t learn the data set correctly.

## GitHub Repository

The full project can be viewed on [GitHub](https://github.com/joshjennings98/fsharp-neural-network).