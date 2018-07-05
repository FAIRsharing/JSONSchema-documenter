(function(){

    var my_app = angular.module('generatorApp', ['ngRoute']);

    my_app.controller('documenterController', ['$scope','$location',
        function($scope, $location) {
            let base_url = 'https://w3id.org/dats/schema/';
            let schema_file = getUrlFromUrl()["url"];
            let fetch_url = "";
            if (typeof schema_file !== 'undefined'){
                fetch_url = base_url + schema_file + '.json';
            }
            else{
                fetch_url = base_url+'study_schema.json';
            }
            var json_schema = this;
            json_schema.loaded_specs = {};
            loadJSON(fetch_url, 0, 'none', null);

            function loadJSON(json_file, lvl, parent_field, parent_type){
                let spec_name = json_file.replace('schemas/', '').replace(".json", "");

                // When lvl = 0 it means we are processing the most upper spec
                if (lvl === 0){
                    json_schema.main_spec = parseJson(json_file);
                    seek_subSpecs(json_schema.main_spec.properties, json_schema.main_spec['title']);
                }

                /* level > 0 means it's a sub spec */
                else{
                    let referencingParent = parent_type+" : "+parent_field;

                    // If the spec hasn't been loaded yet
                    if (typeof json_schema.loaded_specs[spec_name] === 'undefined'){

                        // Parse the json schema
                        json_schema.loaded_specs[spec_name] = parseJson(json_file);

                        // If the result isn't false
                        if (json_schema.loaded_specs[spec_name]){

                            // Create an empty array to display the object the field is referenced from
                            if (typeof json_schema.loaded_specs[spec_name]['referencedFrom'] === 'undefined'){
                                json_schema.loaded_specs[spec_name]['referencedFrom'] = [];
                            }

                            // Add the object name: field to it
                            if (json_schema.loaded_specs[spec_name]['referencedFrom'].indexOf(referencingParent) === -1){
                                json_schema.loaded_specs[spec_name]['referencedFrom'].push(referencingParent);
                            }
                        }
                        seek_subSpecs(json_schema.loaded_specs[spec_name]['properties'], json_schema.loaded_specs[spec_name]['title']);
                    }

                    // If the spec has already been loaded
                    else{
                        if (spec_name !== "undefined"){
                            if (json_schema.loaded_specs[spec_name]['referencedFrom'].indexOf(referencingParent) === -1){
                                json_schema.loaded_specs[spec_name]['referencedFrom'].push(referencingParent);
                            }
                        }
                    }
                }
            }

            function seek_subSpecs(properties, parent_name) {
                // iterate over the loaded spec and try to locate if sub specs need to be loaded
                for (let property in properties) {
                    // Structure is root[key]['$ref']
                    if (typeof properties[property]['$ref'] !== 'undefined'){
                        loadJSON(base_url+properties[property]['$ref'], 1, property, parent_name);
                    }

                    // Structure is root[key]['items']
                    if (typeof properties[property].items !== 'undefined'){

                        // Structure is root[key]['items']['$ref']
                        if (typeof properties[property].items['$ref'] !== 'undefined'){
                            loadJSON(base_url+properties[property].items['$ref'], 1, property, parent_name);
                        }

                        // Structure is root[key]['items']['anyOf']
                        if (properties[property].items.anyOf !== 'undefined'){
                            for (let sub_item in properties[property].items.anyOf){
                                let new_spec = properties[property].items.anyOf[sub_item]['$ref'];
                                loadJSON(base_url+new_spec, 1, property, parent_name);
                            }
                        }
                    }
                }
            }

            function parseJson(src){
                let request = new XMLHttpRequest();
                request.open("GET", src, false);
                try{
                    request.send(null);
                    return JSON.parse(request.responseText);
                }
                catch(e){
                    console.warn("Error loading: "+src);
                    return false;
                }
            }

            function getUrlFromUrl() {
                let query = location.search.substr(1);
                let result = {};
                query.split("&").forEach(function(part) {
                    let item = part.split("=");
                    result[item[0]] = decodeURIComponent(item[1]);
                });
                return result;
            }

        }
    ]);


    my_app.directive('schemaLoader', function() {
        return {
            restrict: 'A',
            templateUrl: 'include/schema.html',
            scope: {
                schemaLoader: '=',
                parentKey: '='
            },
            link: function($scope, element, attr) {
                $scope.json_source = $scope.schemaLoader;
                $scope.parent = $scope.parentKey;
            }
        }
    });

    my_app.directive('schemaFields', function(){
        return{
            restrict: 'A',
            templateUrl: 'include/fields.html',
            scope: {
                schemaFields: '=',
                parentKey: '='
            },
            link: function($scope, element, attr){
                $scope.fields = $scope.schemaFields;
                $scope.parent = $scope.parentKey;

            }
        }
    });

    my_app.directive('fieldType', function(){
        return{
            restrict: 'A',
            templateUrl: 'include/field.html',
            scope: {
                fieldType: '=',
            },
            link: function($scope, element, attr){
                $scope.field = $scope.fieldType;
            }
        }
    });

    my_app.filter('removeExtraStr', function() {

        // In the return function, we must pass in a single parameter which will be the data we will work on.
        // We have the ability to support multiple other parameters that can be passed into the filter optionally
        return function(input) {
            let output = input.replace('#', '').replace('.json', '').replace('https://w3id.org/dats/schema/', '');
            return output;
        }

    });



})();