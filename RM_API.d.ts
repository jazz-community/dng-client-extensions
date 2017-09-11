/*
Licensed Materials - Property of IBM
    (c) Copyright IBM Corporation 2013, 2014. All Rights Reserved.

Note to U.S.Government Users Restricted Rights:
Use, duplication or disclosure restricted by GSA ADP Schedule 
    Contract with IBM Corp. 
 */

/**
 * The IBM Rational RM 5.0 interface expressed as a TypeScript interface definition.
 * This file targets version 1.0RC1 of the typescript language.
 * API specification is available here: https://jazz.net/wiki/bin/view/Main/RMExtensionsMain
 */
declare module RM {

    /** A reference to a single artifact.
     */
    export interface ArtifactRef {
        equals(ref: ArtifactRef): boolean;
    }

    /** Contains a set of attribute values in an AttributeValues object and
     * associates them with a particular ArtifactRef
     */
    class ArtifactAttributes {
        ref: ArtifactRef;
        values: AttributeValues;

        constructor();
        constructor(ref: ArtifactRef);
        constructor(ref: ArtifactRef, values: AttributeValues);
    }
    
    /** A reference to a Type of artifact
     */
    class ArtifactType {
        name: string;

        constructor(name: string);
    }

    /** Represents a set of attribute values.  Each property is an attribute value */
    class AttributeValues {
        [x: string]: any;
        // int -> number
        // float -> number
        // string -> string
        // xhtml ->string
        // Date -> Date
        // datetime -> Date
        // time -> RM.Time
        // duration -> RM.Duration
        // user -> UserRef
        // enum -> string
        // multivalued enum -> string[]
        // boolean -> boolean
        // artifact -> RM.ArtifactRef
        // artifact type -> RM.ArtifactType

        constructor(args?: any);
    }

    /** Represents a Duration attribute value
     * Values will be normalised on save (2d1h -> 49h)
     */
    class Duration {
        weeks: number;
        days: number;
        hours: number;

        constructor(weeks: number, days: number, hours: number);
    }

    /** Represents a set of links from a single artifact, with a single link type
     * to multiple end points
     * The 'any' in linktype should be either a string or a LinkTypeDefinition
     */
    export interface LinkDefinition<T> {
        art: ArtifactRef;
        linktype: any;
        targets: T[];
    }

    /** Object capturing the results of a getLinkedArtifacts call */
    export interface LinkedDataSet {
        internal: LinkDefinition<ArtifactRef>[];
        external: LinkDefinition<string>[];
    }

    /** Represents a type of link, differentiating between linktypes that have different
     * subject to object and object to subject identifiers
     * The 'direction' string should be an RM.Data.LinkDirection constant
    */
    class LinkTypeDefinition {
        uri: string;
        direction: string;

        constructor(uri: string, direction: string);
    }
    
    /** Represents a location in relation to an artifact in a module.  The ref identifies the artifact
     * and the placement is an RMData_PlacementStrategy value that describes where the specified location
     * is in relation to that artifact.
    */
    class LocationSpecification {
    	ref: ArtifactRef;
        placement: string;

        constructor(ref: ArtifactRef, placement: string);
    }

    /** Represents the result of an attempted operation
     * Code indicates success/failure
     * Message may contain a message suitable for displaying to the user, or for debugging
     * May have an arbitrary number of other properties on it depending on the operation attempted
     * data property varies according to operation attempted (for instance LinkedDataSet or ArtifactAttributes[])
     */
    export interface OperationResult<T> {
        code: string;
        message?: string;
        data: T;
    }

    /** Represents the ability to statically access the possible OperationResult constants
      * These are accessed via RM.OperationResult.OPERATION_... rather than on specific instances
      * of an OperationResult.
      */
    var OperationResult: {
        // Result constants
        OPERATION_OK: string;
        OPERATION_CANCELLED: string;
        OPERATION_INVALID: string;
        OPERATION_FAILED: string;
    }

    // Part of a tree structure
    export interface StructureNode extends ArtifactAttributes {
        ref: ArtifactRef;
        values: AttributeValues;
        children: StructureNode[];
        parent: StructureNode;
    }

    // Represents Time attribute values
    // Times will be validated against 24hr clock notation hh:mm:ss
    class Time {
        hours: number;
        minutes: number;
        seconds: number;

        constructor(hours: number, minutes: number, seconds: number);
    }

    // Contains details about a single user
    export interface User {
        username: string;
        userId: string;
        email: string;
        ref: UserRef;
    }

    // Represents a single user.  Completely opaque - nothing to print out?
    export interface UserRef {
    }

    // Represents 
    export interface ValueRange {
        attributeKey: string;
        valueType: string;
        possibleValues: string[];
        multivalued: boolean;
        min: number;
        max: number;
    }

    interface RMData_Attributes {
        PRIMARY_TEXT: string;
        IDENTIFIER: string;
        CREATED_BY: string;
        CREATED_ON: string;
        MODIFIED_BY: string;
        MODIFIED_ON: string;
        DESCRIPTION: string;
        NAME: string;
        DEPTH: string;
        SECTION_NUMBER: string;
        CONTAINING_MODULE: string;
        IS_HEADING: string;
        FORMAT: string;
        ALTERNATE_SPELLING: string;
        ARTIFACT_TYPE: string
    }

    interface RMData_LinkTypes {
        LINK_TO: LinkTypeDefinition;
        LINK_FROM: LinkTypeDefinition;
        AFFECTED_BY: LinkTypeDefinition;
        CHILD_OF: LinkTypeDefinition;
        PARENT_OF: LinkTypeDefinition;
        ELABORATED_BY: LinkTypeDefinition;
        ELABORATES: LinkTypeDefinition;
        EMBEDDED_IN: LinkTypeDefinition;
        EMBEDS: LinkTypeDefinition;
        EXTERNAL_LINK_TO: LinkTypeDefinition;
        EXTERNAL_LINK_FROM: LinkTypeDefinition;
        EXTRACTED: LinkTypeDefinition;
        EXTRACTED_FROM: LinkTypeDefinition;
        IMPLEMENTED_BY: LinkTypeDefinition;
        REFERENCES: LinkTypeDefinition;
        REFERENCED_BY: LinkTypeDefinition;
        REFERENCES_TERM: LinkTypeDefinition;
        TERM_REFERENCED_BY: LinkTypeDefinition;
        SYNONYM: LinkTypeDefinition;
        TRACKED_BY: LinkTypeDefinition;
        VALIDATED_BY: LinkTypeDefinition;
        DERIVES: LinkTypeDefinition;
        SPECIFIES: LinkTypeDefinition;
        SPECIFIED_BY: LinkTypeDefinition;
    }

    interface RMData_Formats {
        TEXT: string;
        MODULE: string;
        COLLECTION: string;
        WRAPPED: string;
        SKETCH: string;
        BUSINESS_PROCESS_DIAGRAM: string;
        PART: string;
        SCREEN_FLOW: string;
        STORYBOARD: string;
        SIMPLE_FLOW_DIAGRAM: string;
        USE_CASE_DIAGRAM: string;
    }

    interface RMData_ValueTypes {
        INTEGER: string;
        FLOAT: string;
        STRING: string;
        XHTML: string;
        DATE: string;
        DATETIME: string;
        TIME: string;
        DURATION: string;
        USER: string;
        ENUMERATION: string;
        BOOLEAN: string;
        ARTIFACT: string;
    }

    interface RMData_LinkDirection {
        OUT: string;
        IN: string;
        BIDIRECTIONAL: string;
    }
    
    interface RMData_PlacementStrategy {
    	BEFORE: string;
    	BELOW: string;
    	AFTER: string;
    }
    
    interface RMData_Module {
    
    	// Remove an artifact or tree of artifacts from a module, with the option to delete the core artifact as well if
    	// its last use was in this module.
    	removeArtifact:
    	{
    		(ref: ArtifactRef, deleteIfLastUse: boolean, callback: (result: OperationResult<void >) => void): void;
    	};
    	
    	// Creates an artifact in a module with attributes taken from attributeValues and location determined by the strategy
    	createArtifact:
    	{
     		(attributeValues: AttributeValues, strategy: LocationSpecification, callback: (result: OperationResult<ArtifactRef>) => void): void;
    	};
    	
    	// Move an artifact or tree of artifacts to another location in the same module, as determined by the by the strategy
    	moveArtifact:
    	{
    		(ref: ArtifactRef, strategy: LocationSpecification, callback: (result: OperationResult<void >) => void): void;
    	};
    	
    }

    export interface RMData {

        // Constants
        Attributes: RMData_Attributes;
        LinkTypes: RMData_LinkTypes;
        Formats: RMData_Formats;
        ValueTypes: RMData_ValueTypes;
        LinkDirection: RMData_LinkDirection;
        PlacementStrategy: RMData_PlacementStrategy;
        Module: RMData_Module;

        // Read attribute values for one or more artifacts
        // Includes properties as well as attributes (depth et c)
        getAttributes:
        {
            // Attributes on a single artifact
            (refs: ArtifactRef, attributes: string, callback: (result: OperationResult<ArtifactAttributes[]>) => void ): void;
            (refs: ArtifactRef, attributes: string[], callback: (result: OperationResult<ArtifactAttributes[]>) => void ): void;
            (refs: ArtifactRef, callback: (result: OperationResult<ArtifactAttributes[]>) => void ): void;

            // Attributes on a set of artifacts
            (refs: ArtifactRef[], attributes: string, callback: (result: OperationResult<ArtifactAttributes[]>) => void ): void;
            (refs: ArtifactRef[], attributes: string[], callback: (result: OperationResult<ArtifactAttributes[]>) => void ): void;
            (refs: ArtifactRef[], callback: (result: OperationResult<ArtifactAttributes[]>) => void ): void;
        };

        // Read a set of attributes for the contents of the given artifact
        // Assumes the given artifact is an aggregating artifact such as a module or collection
        getContentsAttributes:
        {
            (ref: ArtifactRef, attributes: string, callback: (result: OperationResult<ArtifactAttributes[]>) => void ): void;
            (ref: ArtifactRef, attributes: string[], callback: (result: OperationResult<ArtifactAttributes[]>) => void ): void;
        }

        // Get the structure of the artifacts within the given artifact
        // Assumes the given artifact is a structured aggregating artifact such as a module
        getContentsStructure:
        {
            (ref: ArtifactRef, attributes: string, callback: (result: OperationResult<StructureNode[]>) => void ): void;
            (ref: ArtifactRef, attributes: string[], callback: (result: OperationResult<StructureNode[]>) => void ): void;
            (ref: ArtifactRef, callback: (result: OperationResult<StructureNode[]>) => void ): void;
        }


        // Set attribute values on one or more artifacts in a single operation
        setAttributes:
        {
            (changes: ArtifactAttributes, callback: (result: OperationResult<OperationResult<ArtifactRef>[]>) => void ): void;
            (changes: ArtifactAttributes[], callback: (result: OperationResult<OperationResult<ArtifactRef>[]>) => void ): void;
        }

        // The 'any' type for the parameter "type" should be either a string or a LinkTypeDefinition
        createLink(source: ArtifactRef, type: any, target: ArtifactRef, callback: (result: OperationResult<void >) => void ): void;
        deleteLink(source: ArtifactRef, type: any, target: ArtifactRef, callback: (result: OperationResult<void >) => void ): void;

        // Discover the artifacts linked to the given artifact        
        // The linkTypes array parameter should contain only strings and LinkTypeDefinitions
        getLinkedArtifacts: {
            (ref: ArtifactRef, callback: (result: OperationResult<LinkedDataSet>) => void ): void;
            (ref: ArtifactRef, linkTypes: any[], callback: (result: OperationResult<LinkedDataSet>) => void ): void;
        };

        getValueRange(ref: ArtifactRef, attributes: string[], callback: (result: OperationResult<ValueRange[]>) => void ): void;
        getUserDetails(user: UserRef, callback: (result: OperationResult<User>) => void ): void;
        getCurrentUser(callback: (result: OperationResult<User>) => void): void;
    }



    export interface RMEvent {
        // Callback signature likely to vary according to what event is involved
        // Hard to capture that here (without use of any[] in the callback).
        // Given API is ok for now, anything in the future should be more general (allow more, not restrict)
        subscribe(event: string, callback: (refs: ArtifactRef[]) => void ): void;
        unsubscribe(event: string, callback: (refs: ArtifactRef[]) => void ): void;

        // Known events
        ARTIFACT_SELECTED: string;
        ARTIFACT_OPENED: string;
        ARTIFACT_CLOSED: string;
        ARTIFACT_SAVED: string;
    }

    export interface RMClient {
        getCurrentArtifact(callback: (result: OperationResult<ArtifactAttributes>) => void ): void;

        // Show the web client's Artifact Picker interface and get a callback with the result
        showArtifactPicker:
        {
            // Pick from all visible projects
            (callback: (result : OperationResult<ArtifactRef[]>) => void ): void;

            // Pick from the project containing the given artifact
            (ref: ArtifactRef, callback: (result : OperationResult<ArtifactRef[]>) => void ): void;
        }

        showUserPicker:
        {
            (callback: (result : OperationResult<UserRef[]>) => void ): void;
        }

        // Set the current selection in the client
        // Can only select artifacts present in the current web page (e.g. contents of an open module or artifact explorer view)
        // Will return false and leave selection unchanged if any of the artifacts cannot be selected
        // Triggers a "selection" callback.
        setSelection(refs: ArtifactRef[]): boolean;
    }

    var Data: RMData;
    var Client: RMClient;
    var Event: RMEvent;
    var Version: string;
}