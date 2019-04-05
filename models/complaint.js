'use strict';
module.exports = (sequelize, DataTypes) => {
  const Complaint = sequelize.define('Complaint', {
    category: DataTypes.STRING,
    lat: DataTypes.FLOAT,
    long: DataTypes.FLOAT,
    description: DataTypes.TEXT
  }, {});
  Complaint.associate = function(models) {
    // associations can be defined here
  };
  return Complaint;
};