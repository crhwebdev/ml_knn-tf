// require need to tell tensor flow what to use for calucations
// - using cpu right now
require('@tensorflow/tfjs-node');

// require('@tensorflow/tfjs-node-gpu');

const tf = require('@tensorflow/tfjs');

const loadCSV = require('./load-csv');

let { features, labels, testFeatures, testLabels } = loadCSV(
  './kc_house_data.csv',
  {
    shuffle: true,
    splitTest: 10,
    dataColumns: ['lat', 'long', 'sqft_lot', 'sqft_living'],
    labelColumns: ['price']
  }
);

function knn(features, labels, predictionPoint, k) {
  //Standardize features using formula of : value - average / Standard Deviation

  const { mean, variance } = tf.moments(features, 0);
  const scaledPrediction = predictionPoint.sub(mean).div(variance.pow(0.5));

  return (
    features
      .sub(mean)
      .div(variance.pow(0.5))
      .sub(scaledPrediction)
      .pow(2)
      .sum(1)
      .pow(0.5)
      .expandDims(1)
      .concat(labels, 1)
      .unstack()
      .sort((a, b) => (a.arraySync()[0] > b.arraySync()[0] ? 1 : -1))
      .slice(0, k)
      .reduce((acc, pair) => acc + pair.arraySync()[1], 0) / k
  );
}

const featuresTensor = tf.tensor(features);
const labelsTensor = tf.tensor(labels);
const testFeaturesTensor = tf.tensor(testFeatures);
const testLabelsTensor = tf.tensor(testLabels);

testFeatures.forEach((testPoint, i) => {
  let predictionPoint = tf.tensor(testPoint);

  const result = knn(featuresTensor, labelsTensor, predictionPoint, 10);
  const err = (testLabels[i][0] - result) / testLabels[i][0];

  console.log('guess', result, 'result', testLabels[i][0]);
  console.log('Error', err * 100);
});
