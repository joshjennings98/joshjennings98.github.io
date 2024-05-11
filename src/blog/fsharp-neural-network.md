---
title: Understand Neural Networks using F#
slug: fsharp-neural-network
---

## Understand How A Neural Network Works Using F\#

In this post I will show off a small F# library that allows for the creation of scalable fully-connected [neural networks](https://en.wikipedia.org/wiki/Neural_network_\(machine_learning\)). I will use it to explain how forward and back propagation work via code examples. If you find any mistakes let me know and I will make the necessary changes.

Combining the creation of this library with [guides about backpropagation](https://mattmazur.com/2015/03/17/a-step-by-step-backpropagation-example/) helped me a lot with understanding neural networks and how they worked. I would recommend this as a simple project that could be helpful to learn new languages (especially functional ones) as it requires the use of a lot of fundamental programming language concepts.

### Forward Propagation

[Neural networks](https://en.wikipedia.org/wiki/Neural_network_\(machine_learning\)) consist of interconnected nodes organised in layers. They learn by adjusting the weights of connections between neurons during training, using techniques like forward and backward propagation to minimise the difference between predicted and actual outputs. By training the network on labeled data, neural networks can generalise patterns to make predictions on new data.

#### Single Layer Forward Propagation

A single forward propagation though a layer just involves multiplying the inputs to the layer with the layer weights (their dot product). After this, they are summed and the bias added before having the activation layer for that function applied. This will then be calculated for every layer using the outputs of the previous layer as the inputs to the next.

This can be represented with the following equation:

![z_j^{(l)}=\sum_{i=1}^{n^{(l-1)}}w_{ij}^{(l)}x_i^{(l-1)}+b_j^{(l)}](./static/assets/nn1.svg)

The number of neurons in the previous layer is:

![n^{(l-1)}](./static/assets/nn2.svg)

The weight of the connection between neuron `i` in the previous layer and neuron `j` in the current layer is:

![w_{ij}^{(l)}](./static/assets/nn3.svg)

The output of neuron `i` in the previous layer is:

![x_i^{(l-1)}](./static/assets/nn4.svg)

The bias term for neuron `j` in the current layer:

![b_j^{(l)}](./static/assets/nn5.svg)

How can we represent this in F#? It is simple, we just split up the equation into several parts and pipe the output from one part to another. The `List.map` applies the function to every element in the list:

```fsharp
let forwardSingleLayer (bias : float) (weights : float list list) (inputs : float list) (activation : Activation) : float list =
    weights
    |> List.map (fun list -> List.map2 (*) list inputs)
    |> List.map (fun list -> List.sum list + bias)
    |> activateLayer activation
```

What is `activateLayer`? It is a function that is applied to each of the weighted sums to introduce non-linearity into the network:

![a_j^{(l)}=f(z_j^{(l)})](./static/assets/nn6.svg)

The `activateLayer` function takes an activation and maps the corresponding activation function across the list before returning it. A small part of this function can be see below:

```fsharp
let activateLayer (activation : Activation) (input : float list) : float list =
    match activation with
    | Sigmoid ->
        List.map (fun x -> 1.0 / (1.0 + exp(-x))) input
    | Relu ->
        List.map (fun x -> max x 0.0) input
```

#### Full Forward Propagation

That was a single layer, the process for the full forward propagation needs to apply the previous functions to every layer in the network using the outputs from the previous layer as the inputs to the next. We do this via following steps:

1. First create an empty list the size of the network.
2. Fold though the empty list using the accumulator to store the intermediate activated and unactivated output of all layers. This is done with the `forwardSingleLayer` function from before.
3. Then add an extra layer containing only 1.0s to the end of the forward propagated output. This makes it easier when doing back propagation.

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

This will result in a list of output values that will probably be completely wrong. What we now want to do is work out how wrong they are. We will then adjust all the weights in the network by how much they contributed to the error. Once this is done we can just repeat the forward propagation and error calculation and update steps until the error is sufficiently low. In the next section we will work out how to calculate the error.

### Calculating Error

To calculate the error in the output, the output of forward propagation and the target output are passed to a function that calculates the loss or error.

```fsharp
let getOverallError (targetOutputs : float list) (actualOutputs : float list) (loss : Loss) : float =
    actualOutputs
    |> List.map2 (lossFunction loss targetOutputs.Length) targetOutputs
    |> List.sum
```

A loss function (`L`) quantifies the difference between the predicted outputs (`y` with hat) of the network and the actual target values (`y`). This can be used to calculate the total error via the following equation:

![E=\frac{1}{n}\sum_{i=1}^{n}L(y_i,\hat{y}_i)](./static/assets/nn7.svg)

Here is how we can apply the loss function with F#. Similarly to the activation functions, the loss functions are supplied using pattern matching. In this case however, they return a function that can be applied wherever the particular value required instead of taking an returning a list. Part of `lossFunction` can be seen below. There are multiple loss functions that are supported, the ones you see here are mean squared error and mean absolute error:

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

The choice of loss function [depends on the type of problem](https://machinelearningmastery.com/how-to-choose-loss-functions-when-training-deep-learning-neural-networks/) being solved (e.g. mean square error for regression problems; mean absolute error for mostly Gaussian regression problems with outliers; or cross-entropy error for classification problems).

### Back Propagation

Back propagation is more complex than the forward version. We need to go backwards through the network and modify each weight based on how much it contributed to the error. 

#### Output Layer

For the output layer, we compute the derivative of the loss function with respect to the outputs. For the following equations, `L` is the loss function, `o` is a network output, `t` is the target output, and the derivative is that of the activation function. The gradient can then be computed as:

![\delta_i=\frac{\partial L}{\partial o_i}=(o_i - t_i)\cdot\frac{\partial\sigma}{\partial z_i}](./static/assets/nn8.svg)

#### Hidden Layers

For the hidden layers, the individual deltas for each node in the previous layer are found by propagating the error backward from the output. This involves calculating the error contribution from each node to the subsequent layers, represented as:

![\delta_j=\sum_{k}\delta_k w_{jk}\cdot\frac{\partial\sigma}{\partial z_j}](./static/assets/nn9.svg)

This formula calculates the error contributed by a neuron `j` by summing the contributions of errors from neurons in the subsequent layer `k`, weighted by the connection `w` between the neurons in each layer and multiplies it by the derivative of the activation function with respect to the input to neuron `j`.

<details>
<summary>
Click here to see how the chain rule is used to derive the above equation
</summary>

Let's consider a neural network with a layered architecture where:

![z_j](./static/assets/nn17.svg)

represents the input to neuron `j` in layer `l`,

![\sigma](./static/assets/nn18.svg)

is the activation function,

![a_j=\sigma(z_j)](./static/assets/nn19.svg)

is the activation output of neuron `j`,

![w_{jk}](./static/assets/nn20.svg)

represents the weight from neuron `j` in layer `l` to neuron `k` in layer `l+1`,

![\delta_k](./static/assets/nn21.svg)

is the backpropagated error (gradient of the loss with respect to the input of neuron `k`) for neurons in layer `l+1`.

The contribution of the weights to the error can be calculated using the chain rule. The [chain rule](https://en.wikipedia.org/wiki/Chain_rule) is a formula that expresses the derivative of the composition of two differentiable functions `f` and `g` in terms of the derivatives of `f` and `g`. It states the following:

![\frac{\partial f}{\partial g}=\frac{\partial f}{\partial x}\cdot\frac{\partial x}{\partial g}](./static/assets/chainrule.svg)

To see how it works there is some good information [on the wikipedia page](https://en.wikipedia.org/wiki/Chain_rule#Intuitive_explanation)

The chain rule is important in back propagation because it helps break down the calculation of how each weight affects the loss function into easier to manage components. Each weight's gradient is obtained by multiplying simpler derivatives through each layer. When updating the weights, the chain rule is applied as follows:

### Expressing the partial derivative of the gradient of the loss function with respect to the weight between `i` and `j`

Using the chain rule we get:

![\frac{\partial L}{\partial w_{ij}}=\frac{\partial L}{\partial a_j}\frac{\partial a_j}{\partial z_j}\frac{\partial z_j}{\partial w_{ij}}](./static/assets/nn13.svg)

Where:

![\frac{\partial L}{\partial a_j}](./static/assets/nn14.svg)

is the gradient of the loss with respect to the activation output of neuron `j` and:

![\frac{\partial a_j}{\partial z_j}=\sigma'(z_j)](./static/assets/nn15.svg)

since `a` is the activation function applied to `z` and:

![\frac{\partial z_j}{\partial w_{ij}}=a_i](./static/assets/nn16.svg)

since `z` is the sum of the weights multiplied by the outputs of the activation function:

![z_j = \sum_i w_{ij} a_i](./static/assets/nn10.svg)

### Error for neuron `j`

The error for neuron `j` is the effect of weight on the input of neuron `j`, which is the derivative of the activation function of neuron `j`:

![\delta_j=\frac{\partial L}{\partial z_j}](./static/assets/nn22.svg)

By the chain rule, this can be expanded as:

![\delta_j=\frac{\partial L}{\partial a_j}\frac{\partial a_j}{\partial z_j}=\left(\sum_{k}\frac{\partial L}{\partial z_k}\frac{\partial z_k}{\partial a_j}\right)\sigma'(z_j)](./static/assets/nn23.svg)

Where:

![\frac{\partial z_k}{\partial a_j}=w_{jk}](./static/assets/nn24.svg)

since:

![z_k=\sum_j w_{jk}a_j](./static/assets/nn11.svg)

and by definition:

![\frac{\partial L}{\partial z_k}=\delta_k](./static/assets/nn25.svg)

### Final result

Combining these equations together makes it much easier to calculate the contribution of a specific weight to the error. The result of applying the chain rule means that the derivative of the loss with respect to a specific weight is given by the much simpler equation:

![\delta_j=\sum_{k}\delta_k w_{jk}\cdot\frac{\partial\sigma}{\partial z_j}](./static/assets/nn9.svg)

</details>

This value is then used to update the weights. We multiply it by a learning rate that controls how large the weight updates are between runs:

![w_{new}=w_{old}-learningRate\times\frac{\partial L}{\partial w_{ij}}](./static/assets/nn12.svg)

With this we have modified the weights based on their contribution to the total error! This means that in subsequent forward propagations the error will be lower (for the same specific input). Later when we train the network, we will constantly be updating the weights and due to using lots of different inputs this contribution will fluctuate. 

So how do we do this with F#? We first calculate the intermediate output sums. For the output layer, the only thing that needs to be done is for the derivatve of the loss function to applied to the outputs. For the hidden layers, we can utilise the chain rule. This simplifies the calculation so that the  the individual deltas for each node in the previous layer are found. Afterwards, the layer weights are taken and multiplied by their matching deltas. The values coming into each node are then summed.

The new weights are then calculated. This is simpler. The derivative of the activation function is found and then multiplied by the corresponding output delta sum. This is then multiplied by the output of of the previous layer resulting in a value corresponding to `learningRate * delta * outPrev`. This value is then subtracted from the corresponding weight as back propagation is defined.

The new weights and intermediate output deltas are then returned.

```fsharp
let backPropSingleLayer (targetOutputs : float list) (loss : Loss) (learningRate : float) (backPropPart : float list) (layerIndex : int) (forwardPropParts : float list list) (allWeights : float list list list) (layers : Layer list) : float list list * float list =

    let intermediateOutputDeltaSum =
        if layerIndex = 0
        then // Output layer
            forwardPropParts.[layerIndex + 1]
            |> List.map2 (dLossFunction loss targetOutputs.Length) backPropPart
        else // Hidden layers
            List.init forwardPropParts.[layerIndex + 1].Length (fun _ ->
                forwardPropParts.[layerIndex]
                |> dActivateLayer layers.[layerIndex - 1].activation
                |> List.map2 (*) backPropPart)
            |> List.mapi (fun index1 deltas ->
                allWeights.[layerIndex]
                |> List.mapi (fun index2 weights -> weights.[index1] * deltas.[index2]))
            |> List.map List.sum

    let newWeights =
        forwardPropParts.[layerIndex + 1]
        |> dActivateLayer layers.[layerIndex].activation
        |> List.map2 (*) intermediateOutputDeltaSum
        |> List.map (fun delta ->
            forwardPropParts.[layerIndex + 2]
            |> List.map (fun out -> learningRate * delta * out))
        |> List.map2 (List.map2 (-)) allWeights.[layerIndex + 1]

    newWeights, intermediateOutputDeltaSum
```

The full back propagation involved first reversing the parameters. This makes it easier to work on as we start from the final layer and work towards the input.

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

To train a neural network you repeatedly run forward and backwards propagation and then update the weights accordingly. We repeatedly try out different inputs to avoid the network learning a specific input.

Training the network in F# is a fairly simple recursive function that continually picks a random sample of the data set and carries out forwards and backwards propagation using the sample for any number of iterations. A simplified version of the function (initialisation and printing etc. removed) can be seen below:

```fsharp
let rec train (parameters : Parameters) (model : Layer list) (maxIterations : int) (iterations : int) =
    let idx = System.Random().Next(0, List.length targetOutputs)

    let fullSingle =
        forwardFull parameters inputs.[idx] architecture
        |> backPropFull architecture parameters targets.[idx] learningRate loss
        |> weightUpdate parameters

    train fullSingle model maxIterations (iterations + 1)

// This is called like below
train initial architecture iterations 0
```

## Using the library

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
// Inputs
let data = [
    [0.5; 1.0; 0.2];
    [0.1; 0.7; 1.0];
    [1.0; 0.1; 0.1];
    [0.0; 0.34; 0.8];
    [0.6; 0.1; 0.3]
]

// Labels
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
// trainNetwork architecture labels data learning-rate loss iterations
let model = trainNetwork network labels data 0.05 MSE 100000
```

Currently, the following loss functions are avaliable:

* Mean Square Error
* Cross Entropy
* Mean Absolute Error

### Running a trained network

A single run of the network can be specified as follows:

```fsharp
// runNetwork model input architecture
runNetwork model [0.1; 0.8; 0.4] network // [0.90643753; 0.99834754]
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

## Bugs

Be careful with the chosen parameters. The networks can die easily if the chosen parameters cause weigths to overflow and become NaN, alternatively the network won’t learn the data set correctly.

## Acknowledgements

A lot of inspiration comes from [this excellent blog post on backpropagation](https://mattmazur.com/2015/03/17/a-step-by-step-backpropagation-example/).

## GitHub

The full project can be viewed on [GitHub](https://github.com/joshjennings98/fsharp-neural-network).
