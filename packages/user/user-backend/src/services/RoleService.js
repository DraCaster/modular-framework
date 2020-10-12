import {DefaultLogger as winston} from '@dracul/logger-backend';
import RoleModel from '../models/RoleModel'
import {UserInputError} from 'apollo-server-express'


export const fetchRolesInName = function (roleNames) {
    return new Promise((resolve, reject) => {
        RoleModel.find({name: {$in: roleNames }}).exec((err, res) => {

            if(err){
                winston.error("RoleService.fetchRolesInName ", err)
                reject(err)
            }
            resolve(res)

        });
    })
}


export const findRoles = function (roles = []) {
    return new Promise((resolve, reject) => {

        let qs = {}

        if (roles && roles.length) {
            qs._id = {$in: roles}
        }

        RoleModel.find(qs).isDeleted(false).exec((err, res) => {

            if(err){
                winston.error("RoleService.findRoles ", err)
                reject(err)
            }
            resolve(res)

        });
    })
}

export const findRole = function (id) {
    return new Promise((resolve, reject) => {
        RoleModel.findOne({ _id: id }).exec((err, res) => {

            if(err){
                winston.error("RoleService.findRole ", err)
                reject(err)
            }
            resolve(res)

        });
    })
}

export const findRoleByName = function (roleName) {
    return new Promise((resolve, reject) => {
        RoleModel.findOne({ name: roleName }).exec((err, res) => {

            if(err){
                winston.error("RoleService.findRoleByName ", err)
                reject(err)
            }
            resolve(res)

        });
    })
}


export const deleteRole = function (id) {
    return new Promise((resolve, rejects) => {
        findRole(id).then((doc) => {
            doc.softdelete(function (err) {

                if(err){
                    winston.error("RoleService.deleteRole ", err)
                    reject(err)
                }

                resolve({ id: id, success: true })

            });
        })
    })
}

export const createRole = function ({ name, childRoles, permissions }) {
    const newRole = new RoleModel({
        name,
        childRoles,
        permissions
    })
    newRole.id = newRole._id;
    return new Promise((resolve, rejects) => {
        newRole.save((error => {
            if (error) {

                if (error.name == "ValidationError") {
                    winston.warn("RoleService.createRole.ValidationError ", error)
                    rejects(new UserInputError(error.message, {inputErrors: error.errors}));
                }else{
                    winston.error("RoleService.createRole ", error)
                }

                rejects(error)
            } else {
                resolve(newRole)
            }
        }))
    })
}


export const updateRole = async function (id, { name,  childRoles, permissions = [] }) {
    return new Promise((resolve, rejects) => {
        RoleModel.findOneAndUpdate({ _id: id },
            { name, childRoles, permissions },
            { new: true, runValidators: true, context: 'query' },
            (error, doc) => {

                if (error) {
                    if (error.name == "ValidationError") {
                        winston.warn("RoleService.updateRole.ValidationError ", error)
                        rejects(new UserInputError(error.message, { inputErrors: error.errors }));
                    }else{
                        winston.error("RoleService.updateRole ", error)
                    }
                    rejects(error)
                }

                resolve(doc)
            })
    })
}

