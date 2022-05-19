import { api, LightningElement, wire } from 'lwc';
import AK from 'c/handleApiValues';
import getValuesForCombobox from '@salesforce/apex/ProfileManagement.getValuesForCombobox';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import PROFILE_CHANNEL from '@salesforce/messageChannel/ProfileChannel__c';
import { publish, MessageContext } from 'lightning/messageService';

export default class ReusableComboboxComponent extends LightningElement 
{
    @api recordId;
    @api existingProfile;

    @wire(MessageContext)
    messageContext;

    _leftText = '';
    @api
    set leftText(val){
        this._leftText = val;
    }
    get leftText()
    {
        return this._leftText;
    }

    _filterText = '';
    @api
    set filterText(val)
    {
        this._filterText = val;
    }
    get filterText()
    {
        return this._filterText;
    }

    _maxRecordCount = 0;
    @api
    set maxRecords(val)
    {
        this._maxRecordCount = val;
    }
    get maxRecords()
    {
        return this._maxRecordCount;
    }

    _placeholder = '';
    @api
    set placeholder(val)
    {
        this._placeholder = val;
    }
    get placeholder()
    {
        return this._placeholder;
    }

    _value = '';
    get getSelectedValue()
    {
        return this._value;
    }

    _objName = '';
    @api
    set objName(val)
    {
        if(typeof val === 'string')
            this._objName = val;
    }
    get objName()
    {
        return this._objName;
    }

    _isRecord = false;
    @api
    set isRecord(val)
    {
        if(val)
            this._isRecord = val;
    }
    get isRecord()
    {
        return this._isRecord;
    }

    _options = [];
    get getOptions()
    {
        return this._options.length > 0 ? this._options : [{label : 'No Data Available',value : 'NA'}];
    }

    @wire(getValuesForCombobox,{ 
        objName : '$objName',
        isRecord : '$isRecord',
        l : '$maxRecords',
        leftFilter : '$leftText',
        filterName : '$filterText'
    })
    wiredCallback({error,data}){
        if(error){
            let message = 'Unknown Error';
            if(Array.isArray(error.body))
            {
                message = error.body.map(e => e.message).join(', ');
            }
            else if(typeof error.body.message === 'string')
            {
                message = error.body.message;
            }
            this.dispatchEvent(
                new ShowToastEvent({
                    title : 'Error Loading Records/Picklist Values',
                    message,
                    variant: 'error'
                }),
            );
        }
        else if(data){
            //alert(`Got ${JSON.stringify(data)}`);
            this._options = new AK().setOptions(data,this.existingProfile);
        }
    }

    handleChange(event) {
        this._value = event.detail.value;
        if(this._objName === 'UserLicense')
        {
            const payload = { recordId : this._value };
            publish(this.messageContext,PROFILE_CHANNEL,payload);
        }
        else
        {
            const cEvent = new CustomEvent('select' , 
            {
                detail : {
                    userId : this.recordId,
                    newProfileId : this._value
                    }
                }
            );
            this.dispatchEvent(cEvent);
        }
    }
}