import React, { Component } from "react";
import axios from "axios";

import "./EditProduct.css";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";

import { Stitch, RemoteMongoClient } from "mongodb-stitch-browser-sdk";
import BSON from "bson";

class ProductEditPage extends Component {
  state = {
    isLoading: true,
    title: "",
    price: "",
    imageUrl: "",
    description: "",
  };

  componentDidMount() {
    // Will be "edit" or "add"
    if (this.props.match.params.mode === "edit") {
      const mongodb = Stitch.defaultAppClient.getServiceClient(
        RemoteMongoClient.factory,
        "mongodb-atlas"
      );
      mongodb
        .db("shop")
        .collection("products")
        .find({ _id: new BSON.ObjectId(this.props.match.params.id) })
        .asArray()
        .then((productResponse) => {
          const transformproduct = productResponse[0];
          console.log("productREsponse is", transformproduct);
          transformproduct._id = transformproduct._id.toString();
          transformproduct.price = transformproduct.price.toString();

          this.setState({
            isLoading: false,
            title: transformproduct.name,
            price: transformproduct.price,
            imageUrl: transformproduct.image,
            description: transformproduct.description,
          });
        })
        .catch((err) => {
          this.setState({ isLoading: false });
          console.log(err);
          this.props.onError(
            "Loading the product failed. Please try again later"
          );
        });

      /*
      axios
        .get("http://localhost:3100/products/" + this.props.match.params.id)
        .then((productResponse) => {
          const product = productResponse.data;
          this.setState({
            isLoading: false,
            title: product.name,
            price: product.price.toString(),
            imageUrl: product.image,
            description: product.description,
          });
        })
        .catch((err) => {
          this.setState({ isLoading: false });
          console.log(err);
        });
        */
    } else {
      this.setState({ isLoading: false });
    }
  }

  editProductHandler = (event) => {
    event.preventDefault();
    if (
      this.state.title.trim() === "" ||
      this.state.price.trim() === "" ||
      this.state.imageUrl.trim() === "" ||
      this.state.description.trim() === ""
    ) {
      return;
    }
    this.setState({ isLoading: true });
    const productData = {
      name: this.state.title,
      price: BSON.Decimal128.fromString(this.state.price.toString()),
      image: this.state.imageUrl,
      description: this.state.description,
    };

    let request;
    const mongodb = Stitch.defaultAppClient.getServiceClient(
      RemoteMongoClient.factory,
      "mongodb-atlas"
    );
    if (this.props.match.params.mode === "edit") {
      request = mongodb
        .db("shop")
        .collection("products")
        .updateOne(
          { _id: new BSON.ObjectId(this.props.match.params.id) },
          productData
        );
      /*
      request = axios.patch(
        "http://localhost:3100/products/" + this.props.match.params.id,
        productData
      );
      */
    } else {
      request = mongodb
        .db("shop")
        .collection("products")
        .insertOne(productData);

      //request = axios.post("http://localhost:3100/products", productData);
    }
    request
      .then((result) => {
        this.setState({ isLoading: false });
        this.props.history.replace("/products");
      })
      .catch((err) => {
        this.setState({ isLoading: false });
        console.log(err);
        this.props.onError(
          "Editing or adding the product failed. Please try again later"
        );
      });
  };

  inputChangeHandler = (event, input) => {
    this.setState({ [input]: event.target.value });
  };

  render() {
    let content = (
      <form className="edit-product__form" onSubmit={this.editProductHandler}>
        <Input
          label="Title"
          config={{ type: "text", value: this.state.title }}
          onChange={(event) => this.inputChangeHandler(event, "title")}
        />
        <Input
          label="Price"
          config={{ type: "number", value: this.state.price }}
          onChange={(event) => this.inputChangeHandler(event, "price")}
        />
        <Input
          label="Image URL"
          config={{ type: "text", value: this.state.imageUrl }}
          onChange={(event) => this.inputChangeHandler(event, "imageUrl")}
        />
        <Input
          label="Description"
          elType="textarea"
          config={{ rows: "5", value: this.state.description }}
          onChange={(event) => this.inputChangeHandler(event, "description")}
        />
        <Button type="submit">
          {this.props.match.params.mode === "add"
            ? "Create Product"
            : "Update Product"}
        </Button>
      </form>
    );
    if (this.state.isLoading) {
      content = <p>Is loading...</p>;
    }
    return <main>{content}</main>;
  }
}

export default ProductEditPage;
